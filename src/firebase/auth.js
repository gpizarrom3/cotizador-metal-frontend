import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from './config'

const registrarEnLista = async (user, isNew = false) => {
  const data = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    ultimoLogin: serverTimestamp(),
    provider: user.providerData?.[0]?.providerId || 'email',
  }
  if (isNew) data.creadoEn = serverTimestamp()
  await setDoc(doc(db, 'usuarios_lista', user.uid), data, { merge: true })
}

export const registerWithEmail = async (email, password, displayName) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  await registrarEnLista({ ...credential.user, displayName }, true)
  return credential.user
}

export const loginWithEmail = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  await registrarEnLista(credential.user)
  return credential.user
}

export const loginWithGoogle = async () => {
  const credential = await signInWithPopup(auth, googleProvider)
  const isNew = credential._tokenResponse?.isNewUser ?? false
  await registrarEnLista(credential.user, isNew)
  return credential.user
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

export const logout = () => signOut(auth)
