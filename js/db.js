// IndexedDB com reserva em memória (se o navegador não permitir).
const NOME = 'bora';
const VERSAO = 1;
const STORES = {
  perfis: { keyPath: 'id' },
  sessoes: { keyPath: 'id', indices: [['perfilId', 'perfilId']] },
  conquistas: { keyPath: 'id', indices: [['perfilId', 'perfilId']] },
  videos: { keyPath: 'exId' },
  meta: { keyPath: 'k' },
};

let dbPromise = null;
let memoria = null; // reserva

function abrir() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((ok) => {
    let req;
    try {
      req = indexedDB.open(NOME, VERSAO);
    } catch {
      return ok(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [nome, cfg] of Object.entries(STORES)) {
        if (db.objectStoreNames.contains(nome)) continue;
        const st = db.createObjectStore(nome, { keyPath: cfg.keyPath });
        for (const [iNome, campo] of cfg.indices || []) st.createIndex(iNome, campo);
      }
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ok(null);
    req.onblocked = () => ok(null);
  }).then((db) => {
    if (!db) {
      memoria = Object.fromEntries(Object.keys(STORES).map((k) => [k, new Map()]));
    }
    return db;
  });
  return dbPromise;
}

export async function usandoMemoria() {
  await abrir();
  return !!memoria;
}

function chaveDe(store, valor) {
  return valor[STORES[store].keyPath];
}

function pedido(req) {
  return new Promise((ok, erro) => {
    req.onsuccess = () => ok(req.result);
    req.onerror = () => erro(req.error);
  });
}

export async function pegar(store, chave) {
  const db = await abrir();
  if (!db) return memoria[store].get(chave) ?? undefined;
  return pedido(db.transaction(store).objectStore(store).get(chave));
}

export async function todos(store, indice, valor) {
  const db = await abrir();
  if (!db) {
    const lista = [...memoria[store].values()];
    return indice ? lista.filter((x) => x[indice] === valor) : lista;
  }
  const st = db.transaction(store).objectStore(store);
  return pedido(indice ? st.index(indice).getAll(valor) : st.getAll());
}

export async function chaves(store) {
  const db = await abrir();
  if (!db) return [...memoria[store].keys()];
  return pedido(db.transaction(store).objectStore(store).getAllKeys());
}

export async function salvar(store, valor) {
  const db = await abrir();
  if (!db) {
    memoria[store].set(chaveDe(store, valor), valor);
    return valor;
  }
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(valor);
  await new Promise((ok, erro) => {
    tx.oncomplete = ok;
    tx.onerror = () => erro(tx.error);
    tx.onabort = () => erro(tx.error || new Error('Transação abortada'));
  });
  return valor;
}

export async function apagar(store, chave) {
  const db = await abrir();
  if (!db) {
    memoria[store].delete(chave);
    return;
  }
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(chave);
  await new Promise((ok, erro) => {
    tx.oncomplete = ok;
    tx.onerror = () => erro(tx.error);
  });
}

export async function persistir() {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* sem suporte */
  }
  return false;
}
