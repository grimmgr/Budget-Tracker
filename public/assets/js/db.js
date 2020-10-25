let db;
let store;
// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = event => {
   // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = event => {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = event => {
  console.log("Woops! " + event.target.errorCode);
};

export function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  store = transaction.objectStore("pending");
}

export function saveRecord(record) {
  accessStore();
  // add record to your store with add method.
  store.add(record);
}

function checkDatabase() {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  store = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // create a transaction on the pending db with readwrite access
        const transaction = db.transaction(["pending"], "readwrite");
        // access your pending object store
        store = transaction.objectStore("pending");
        // clear all items in your store
        store.clear();
      });
    }
  };
}

export function getIndxdbTransactions() {
    return new Promise((resolve, reject) => {
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    store = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function() {
      resolve(getAll.result);
    };
  })
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);