import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export async function clearMyImages() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('Not authenticated');
      return;
    }

    const imagesRef = collection(db, 'images');
    const q = query(imagesRef, where('userId', '==', currentUser.uid));
    const snapshot = await getDocs(q);

    console.log(`Deleting ${snapshot.size} images...`);

    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(doc(db, 'images', docSnapshot.id));
    }

    console.log('All your images deleted successfully!');
    localStorage.removeItem('demo_images_seeded');
  } catch (error) {
    console.error('Error deleting images:', error);
  }
}
