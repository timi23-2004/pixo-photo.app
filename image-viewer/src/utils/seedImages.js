import { collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

export { clearMyImages } from './clearMyImages';

export async function seedDemoImages() {
  try {
    // Ellenőrizzük, hogy már lefutott-e a seed
    const hasSeedRun = localStorage.getItem('demo_images_seeded');
    if (hasSeedRun === 'true') {
      console.log('Demo images already seeded');
      return;
    }

    console.log('Seeding demo images...');
    
    const demoUsers = [
      'demo1@example.com',
      'demo2@example.com', 
      'demo3@example.com',
      'user@test.com'
    ];

    const imageCategories = [
      'nature', 'city', 'technology', 'people', 'food',
      'animals', 'architecture', 'travel', 'art', 'business'
    ];

    // Aktuális felhasználó ellenőrzése
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('User not authenticated, skipping seed');
      return;
    }

    // 100 random kép létrehozása demo felhasználókkal
    for (let i = 0; i < 100; i++) {
      const width = Math.floor(Math.random() * 400) + 400; // 400-800
      const height = Math.floor(Math.random() * 300) + 300; // 300-600
      const randomId = Math.floor(Math.random() * 1000);
      const category = imageCategories[i % imageCategories.length];
      const userEmail = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      
      await addDoc(collection(db, 'images'), {
        userId: `demo_user_${Math.floor(i / 25)}`,
        userEmail: userEmail,
        fileName: `demo_${category}_${i + 1}.jpg`,
        storagePath: null,
        downloadURL: `https://picsum.photos/id/${randomId}/${width}/${height}`,
        uploadedAt: serverTimestamp()
      });
      
      // Kis késleltetés, hogy ne spammelje a Firestore-t
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    localStorage.setItem('demo_images_seeded', 'true');
    console.log('Demo images seeded successfully! Total: 100 images');
  } catch (error) {
    console.error('Error seeding demo images:', error);
  }
}
