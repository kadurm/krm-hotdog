import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';

// Tenta obter credenciais das variáveis de ambiente Vite ou do localStorage
export const getFirebaseConfig = () => {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('nuu_firebase_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      } catch (e) {}
    }
  }

  return envConfig;
};

export const saveFirebaseConfig = (config) => {
  if (typeof window !== 'undefined') {
    if (config && config.projectId && config.apiKey) {
      localStorage.setItem('nuu_firebase_config', JSON.stringify({
        apiKey: config.apiKey.trim(),
        authDomain: config.authDomain?.trim() || '',
        projectId: config.projectId.trim(),
        storageBucket: config.storageBucket?.trim() || '',
        messagingSenderId: config.messagingSenderId?.trim() || '',
        appId: config.appId?.trim() || ''
      }));
    } else {
      localStorage.removeItem('nuu_firebase_config');
    }
  }
};

let firebaseAppInstance = null;
let firestoreDbInstance = null;
let lastProjectId = '';

export const getFirebaseApp = () => {
  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  if (firebaseAppInstance && lastProjectId === config.projectId) {
    return firebaseAppInstance;
  }

  try {
    lastProjectId = config.projectId;
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseAppInstance = getApp();
    } else {
      firebaseAppInstance = initializeApp(config);
    }
    firestoreDbInstance = getFirestore(firebaseAppInstance);
    return firebaseAppInstance;
  } catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
    return null;
  }
};

export const getFirestoreDb = () => {
  if (firestoreDbInstance && lastProjectId === getFirebaseConfig().projectId) {
    return firestoreDbInstance;
  }
  const app = getFirebaseApp();
  if (!app) return null;
  firestoreDbInstance = getFirestore(app);
  return firestoreDbInstance;
};

export const isFirebaseConfigured = () => {
  const config = getFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};

export const testFirebaseConnection = async (testConfig) => {
  const config = testConfig || getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { success: false, message: 'API Key e Project ID do Firebase são obrigatórios.' };
  }

  try {
    let testApp;
    const testAppName = `test-connection-${Date.now()}`;
    testApp = initializeApp(config, testAppName);
    const testDb = getFirestore(testApp);

    // Tenta uma leitura simples da coleção orders
    const q = query(collection(testDb, 'orders'), limit(1));
    await getDocs(q);

    return { 
      success: true, 
      message: 'Conexão com o Cloud Firestore estabelecida com sucesso!' 
    };
  } catch (err) {
    console.warn('Erro ao testar Firebase:', err);
    if (err.message && err.message.includes('permission-denied')) {
      return { 
        success: false, 
        message: 'Conectou ao projeto, mas as Regras de Segurança do Firestore bloquearam a leitura. Habilite o modo de teste ou configure as regras em firestore.rules.' 
      };
    }
    return { 
      success: false, 
      message: err.message || 'Falha ao conectar com o Firebase Firestore.' 
    };
  }
};

// Regras recomendadas para o Cloud Firestore no Console
export const FIRESTORE_RULES_GUIDE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura e escrita nas coleções do Nuu Prensado (Cardápio e KDS)
    match /orders/{orderId} {
      allow read, write: if true;
    }
    match /store_settings/{settingId} {
      allow read, write: if true;
    }
    match /products/{productId} {
      allow read, write: if true;
    }
    match /inventory/{itemId} {
      allow read, write: if true;
    }
  }
}`;
