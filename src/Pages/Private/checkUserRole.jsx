import { auth, database } from '../../firebase';
import { ref, get } from 'firebase/database';

const checkUserRole = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('User not logged in');
    return;
  }

  const roles = ['donor', 'recipient', 'volunteer'];

  for (let role of roles) {
    const roleRef = ref(database, `${role}/${user.uid}`);
    const snapshot = await get(roleRef);
    if (snapshot.exists()) {
      console.log(`User role is: ${snapshot.val().role}`);
      return snapshot.val().role;
    }
  }

  console.log('No role found for the user');
};

export default checkUserRole;