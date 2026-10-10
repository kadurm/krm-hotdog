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
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBmg6E18Q_PkOE1wGW1Zqtc6Qbu7_ZoKq4',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nuuprensado.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nuuprensado',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nuuprensado.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '74166433459',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:74166433459:web:403575faad33e0d05322c6'
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

    // ===============================================================
    // Assumed Data Model
    // ===============================================================
    //
    // Collection: orders
    // Document ID: {orderId} (e.g. '1001', '1002')
    // Fields:
    //   - id: string (required) - unique order identifier
    //   - customerName: string (required) - customer full name
    //   - phone: string (required) - customer contact phone
    //   - type: string (required, 'delivery' | 'balcao' | 'takeaway' | 'table' | 'mesa')
    //   - address: string (optional) - delivery street address
    //   - neighborhood: string (optional) - neighborhood or table identifier
    //   - paymentMethod: string (required) - payment method description
    //   - changeFor: number (optional) - cash change requested
    //   - items: list (required) - order items array
    //   - subtotal: number (optional) - items subtotal
    //   - deliveryFee: number (optional) - delivery fee charged
    //   - discount: number (optional) - discount amount applied
    //   - couponCode: string (optional) - discount coupon applied
    //   - total: number (required) - grand total amount
    //   - status: string (required, 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled')
    //   - motoboyId: string (optional) - assigned courier ID
    //   - motoboySettled: bool (optional) - courier payout flag
    //   - notes: string (optional) - customer notes or instructions
    //   - operatorName: string (optional) - shift operator name
    //   - date: string (required) - creation timestamp ISO string
    //   - updatedAt: string (optional) - update timestamp ISO string
    //   - shippedAt: string (optional) - shipping timestamp ISO string
    //   - deliveredAt: string (optional) - delivery timestamp ISO string
    //
    // Collection: store_settings
    // Document ID: {settingId} (e.g. 'current', 'settings')
    // Fields:
    //   - id: string (optional)
    //   - isOpen: bool (optional) - store open toggle
    //   - autoSchedule: bool (optional) - automatic schedule toggle
    //   - openTime: string (optional, 1..10 chars) - opening hour format HH:mm
    //   - closeTime: string (optional, 1..10 chars) - closing hour format HH:mm
    //   - openDays: list (optional) - list of open days
    //   - estimatedTime: string (optional) - delivery ETA text
    //   - storeAddress: string (optional) - store address
    //   - storeLat: number (optional) - store latitude coordinate
    //   - storeLng: number (optional) - store longitude coordinate
    //   - deliveryMode: string (optional) - 'neighborhood' | 'radius' | 'hybrid'
    //   - freeDeliveryThreshold: number (optional) - free delivery threshold
    //   - cardDebitFee: number (optional) - debit card fee percentage
    //   - cardCreditFee: number (optional) - credit card fee percentage
    //   - pixFee: number (optional) - pix fee percentage
    //   - loyaltyTargetStamps: number (optional) - required stamps
    //   - loyaltyMinOrder: number (optional) - min order for stamp
    //   - loyaltyRewardText: string (optional) - reward text
    //   - autoPackagingDeduction: bool (optional) - packaging deduction toggle
    //   - deliveryFeesByNeighborhood: map (optional) - neighborhood fees map
    //   - updatedAt: string (optional) - update timestamp ISO string
    //
    // Collection: products
    // Document ID: {productId} (e.g. '1', '2', etc.)
    // Fields:
    //   - id: number (required) - numeric product ID
    //   - name: string (required) - product name
    //   - description: string (optional) - product description
    //   - price: number (required) - product unit price
    //   - image: string (optional) - product image URL or path
    //   - active: bool (optional) - product visibility
    //   - category: string (optional) - product category
    //   - hasCustomOptions: bool (optional) - customization options flag
    //   - recipe: list (optional) - recipe components list
    //   - createdAt: string | timestamp (optional)
    //   - updatedAt: string | timestamp (optional)
    //
    // Collection: inventory
    // Document ID: {itemId} (e.g. '1', '2', '101', etc.)
    // Fields:
    //   - id: number (required) - numeric item/ingredient ID
    //   - name: string (required) - ingredient title
    //   - quantity: number (required) - current stock level
    //   - minQuantity: number (optional) - alert threshold
    //   - unit: string (optional) - unit of measurement
    //   - cost: number (optional) - unit cost
    //   - updatedAt: string | timestamp (optional)
    //
    // ===============================================================

    // 1. ORDERS: Pedidos do Cardápio, Garçom/Mesa, KDS e Delivery
    match /orders/{orderId} {
      allow read, write: if true;
    }

    // 2. STORE_SETTINGS: Horários, Modo de Frete e Configurações da Loja
    match /store_settings/{settingId} {
      allow read, write: if true;
    }

    // 3. PRODUCTS: Cardápio Oficial (Lanches, Bebidas, Acompanhamentos)
    match /products/{productId} {
      allow read, write: if true;
    }

    // 4. INVENTORY: Controle de Insumos, Carnes, Pães e Embalagens
    match /inventory/{itemId} {
      allow read, write: if true;
    }

  }
}`;


