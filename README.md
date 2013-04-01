Laputin
=======
To create a new Laputin database:

    sqlite3 /some/path/.laputin.db

And execute following SQL statements:

    CREATE TABLE tags (id INTEGER PRIMARY KEY autoincrement, name TEXT UNIQUE);
    CREATE TABLE tags_files (id INTEGER, hash TEXT, PRIMARY KEY (id, hash));
