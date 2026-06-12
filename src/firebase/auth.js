import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, googleProvider } from './config'

export const registerWithEmail = async (email, password, displayName) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  return credential.user
}

export const loginWithEmail = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export const loginWithGoogle = async () => {
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

export const logout = () => signOut(auth)
