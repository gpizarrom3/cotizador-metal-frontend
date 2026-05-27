import { storage } from './config'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

export const subirFichaTecnica = (uid, cotId, file, onProgress) => {
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const path = `fichas/${uid}/${cotId}/${safeName}`
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, path, nombre: file.name, tipo: file.type, tamaño: file.size })
      }
    )
  })
}

export const eliminarArchivoStorage = async (path) => {
  await deleteObject(ref(storage, path))
}
