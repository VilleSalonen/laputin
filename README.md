[![Build Status](https://github.com/VilleSalonen/laputin/actions/workflows/laputin.yml/badge.svg)](https://github.com/VilleSalonen/laputin/actions/workflows/laputin.yml)

# Laputin

Cloud is the cool kid in town these days but sometimes you just want to own your
file collections and still use modern techniques to organize it. Semantic file
systems seem to evade us until the end of time. Thus I resorted to write my own
utility which can be used to organize any file collection by adding tags.

So if you have a lot of podcasts, scanned documents, photographs or videos,
Laputin can be used to organize them into easily searchable and taggable
collections.

**Please** note that because Laputin identified files by their contents, it is not suitable for file collections where the files are routinely modified. Laputin is designed to be used with collections of static files.

_(Laputin as a name comes from a Finnish word lappu which means tag in English. Also this name is close to Action Man type of a president who is very efficient in organizing things.)_

## Technical Details

Technically Laputin is implemented in two parts:

-   Backend implemented in Node. This handles interaction with file system and opening of the file opener associated with the collection.
-   Frontend implemented in HTML5 using Angular 2. Because desktop and command line UIs are so 90s, with Laputin you can organize your file collection from the browser!

Each file in collection is identified by its content. This means that you can
move and rename your files within the collection and Laputin still associates
correct tags to your files.

There are multiple hashing algorithms available. Quick version checks 1024
bytes from the middle of the file and runs that through MD5. Accurate
version runs the whole file through SHA512.

## Installation

TODO: Creating database:

    DATABASE_URL=file:~/.laputin/youtube/laputin.db npx prisma migrate dev --name init
