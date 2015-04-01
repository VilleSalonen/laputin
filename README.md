Laputin
=======
Cloud is the cool kid in town these days but sometimes you just want to own your
file collections and still use modern techniques to organize it. Semantic file
systems seem to evade us until the end of time. Thus I resorted to write my own
utility which can be used to organize any file collection by adding tags.

So if you have a lot of podcasts, scanned documents, photographs or videos,
Laputin can be used to organize them into easily searchable and taggable
collections.

**Please** note that because Laputin identified files by their contents, it is not suitable for file collections where the files are routinely modified. Laputin is best when it's used with collections of static files.

*(Laputin as a name comes from a Finnish word lappu which means tag in English. Also this name is close to Action Man type of a president who is very efficient in organizing things.)*

Technical Details
-----------------
Technically Laputin is implemented in two parts:
* Backend implemented in Node. This handles interaction with file system and opening of the file opener associated with the collection.
* Frontend implemented in HTML5 using AngularJS. Because desktop and command line UIs are so 90s, with Laputin you can organize your file collection from the browser!

Each file in collection is identified by its content. This means that you can
move and rename your files within the collection and Laputin still associates
correct tags to your files.

More specifically, 1024 bytes from the middle of the file is selected for
hashing. This selection is then processed through MD5 algorithm. Middle of the
file is used for selection to so that similar header data would not lead to
collided IDs.

Installation
------------
Firstly: Laputin is pre-alpha software so whatever you organize, please have
backups! Laputin doesn't delete any of your files but I'd hate to be part of
destroying your files. So please, be safe!

When you're creating a new Laputin collection, just start laputin and give it a
path to your library:

    node server.js C:\Users\coolbro\Documents\Videos\

If you start Laputin without any arguments, it will default to the current
working directory and assume it is the directory you want to organize.


Tips & Tricks
-------------
If you want to have a versioning history of your organizational changes,
initialize Git repository in your library path, add .laputin.db under Git and
add following to .laputin.json:

    { "gitVersioning": true }

If you don't want your data files to appear in git status listings etc., write
a following .gitignore file:

    # Ignore everything...
    *

    # ...except Laputin metadata and .gitignore
    !.gitignore
    !.laputin.db
    !.laputin.json

Of course make sure that your library path doesn't contain any previous Git
repositories because Laputin will automatically commit all changed files in that
directory! You have been warned.
