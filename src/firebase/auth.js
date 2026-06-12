import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
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
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    const result = await FirebaseAuthentication.signInWithGoogle()
    const credential = GoogleAuthProvider.credential(
      result.credential?.idToken,
      result.credential?.accessToken
    )
    const userCredential = await signInWithCredential(auth, credential)
    return userCredential.user
  }
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

export const logout = () => signOut(auth)
