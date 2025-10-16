// Idempotent init for single-node replica set and app user
// Requires env: MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD, MONGO_DB_NAME, MONGO_APP_USER, MONGO_APP_PASSWORD, MONGO_REPLICA_SET_NAME, MONGO_PRIMARY

;(() => {
  const env = (name) => process.env[name]
  const rsName = env("MONGO_REPLICA_SET_NAME") || "rs0"
  const primary = env("MONGO_PRIMARY") || "localhost:27017"
  const appDbName = env("MONGO_DB_NAME") || "app"
  const appUser = env("MONGO_APP_USER") || "app"
  const appPass = env("MONGO_APP_PASSWORD") || "appPass123!"

  function wait(ms) {
    sleep(ms)
  }

  // 1) Initiate replica set if not already
  try {
    const status = rs.status()
    if (status.ok !== 1) throw new Error("Replica set not ok")
    print("Replica set already configured:", tojson(status.set))
  } catch (e) {
    print("Replica set not initiated yet. Initiating...")
    try {
      rs.initiate({
        _id: rsName,
        members: [{ _id: 0, host: primary }],
        configsvr: false,
      })
    } catch (e2) {
      print("rs.initiate error (may already be initiated):", e2.message)
    }
    // Wait for PRIMARY
    let tries = 30
    while (tries--) {
      try {
        const st = rs.status()
        if (st.myState === 1) {
          // PRIMARY
          print("Replica set is PRIMARY")
          break
        }
      } catch (_) {}
      wait(2000)
    }
  }

  // 2) Create application user with roles
  const appDb = db.getSiblingDB(appDbName)
  const existing = appDb.getUser(appUser)
  if (existing) {
    print(`User ${appUser} already exists, skipping.`)
  } else {
    print(`Creating application user ${appUser} on db ${appDbName}...`)
    appDb.createUser({
      user: appUser,
      pwd: appPass,
      roles: [
        { role: "readWrite", db: appDbName },
        { role: "dbAdmin", db: appDbName },
      ],
    })
  }

  print("Mongo init completed.")
})()
