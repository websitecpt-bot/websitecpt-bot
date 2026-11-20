import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { firebaseApp } from './lib/firebase';

console.log('Firebase initialization:', firebaseApp ? 'SUCCESS' : 'MISSING CONFIG');

createRoot(document.getElementById('root')!).render(<App />);
