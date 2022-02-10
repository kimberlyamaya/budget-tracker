let db

const request = indexedDB.open('budget_tracker', 1)

request.onupgradeneeded = function(event) {
    // reference the database 
    const db = event.target.result
    // create an object store (table) - auto increment
    db.createObjectStore('new_transaction', { autoIncrement: true })
}

request.onsuccess = function(event) {
    db = event.target.result

    if (navigator.onLine) {
      uploadTransaction()
    }
}
  
request.onerror = function(event) {

  console.log(event.target.errorCode)

}

// save when offline
function saveRecord(transaction) {
  // tried to pass record in function in place of transaction
  // would get DOMException: Failed to execute 'transaction'
  // on IDBDatabase : one of the specified object stores
  // was not found

    // create transaction 
    const transaction = db.transaction(['new_transaction'], 'readwrite')
  
    const budgetObjectStore = transaction.objectStore('new_transaction')
  
    budgetObjectStore.add(transaction)
      // tried to pass record in function in place of transaction
}

function uploadTransaction() {

  const transaction = db.transaction(['new_transaction'], 'readwrite')

  const budgetObjectStore = transaction.objectStore('new_transaction')

  const getAll = budgetObjectStore.getAll()

  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse)
          }

          const transaction = db.transaction(['new_transaction'], 'readwrite')

          const budgetObjectStore = transaction.objectStore('new_transaction')

          budgetObjectStore.clear()

          alert('All saved transactions have been submitted!');
        })
        .catch(err => {
          console.log(err)
        })
    }
  }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction())