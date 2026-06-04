import Stripe from 'stripe'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminDb() {
  if (!getApps().length) {
    const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
    initializeApp({ credential: cert(credentials) })
  }
  return getFirestore()
}

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

async function setSubscription(db, uid, data) {
  await db.collection('suscripciones').doc(uid).set({ ...data, updatedAt: new Date() }, { merge: true })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const sig = req.headers['stripe-signature']

  let event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const db = getAdminDb()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const uid = session.metadata?.firebaseUid
        if (uid && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription)
          await setSubscription(db, uid, {
            plan: 'pro',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
          })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const uid = sub.metadata?.firebaseUid
        if (uid) {
          const isActive = sub.status === 'active' || sub.status === 'trialing'
          await setSubscription(db, uid, {
            plan: isActive ? 'pro' : 'free',
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
          })
        }
        break
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }

  res.status(200).json({ received: true })
}
