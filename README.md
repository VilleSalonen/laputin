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

- Backend implemented in Node. This handles interaction with file system and opening of the file opener associated with the collection.
- Frontend implemented in HTML5 using Angular 2. Because desktop and command line UIs are so 90s, with Laputin you can organize your file collection from the browser!

Each file in collection is identified by its content. This means that you can
move and rename your files within the collection and Laputin still associates
correct tags to your files.

There are multiple hashing algorithms available. Quick version checks 1024
bytes from the middle of the file and runs that through MD5. Accurate
version runs the whole file through SHA512.

## Installation

TODO: Creating database:

    DATABASE_URL=file:~/.laputin/youtube/laputin.db npx prisma migrate dev --name init

## Import from SQLite

    -- Step 1: Import data
    -- op run -- pgloader --verbose --debug /mnt/c/Github/laputin/db.load

    -- Step 2: Create schema import

    -- Step 3: Move import data tables to import schema
    -- ALTER TABLE file SET SCHEMA import;
    -- ALTER TABLE screenshotfile SET SCHEMA import;
    -- ALTER TABLE screenshottag SET SCHEMA import;
    -- ALTER TABLE screenshottimecode SET SCHEMA import;
    -- ALTER TABLE tag SET SCHEMA import;
    -- ALTER TABLE tagsonfiles SET SCHEMA import;
    -- ALTER TABLE tagsontimecodes SET SCHEMA import;
    -- ALTER TABLE timecodesonfiles SET SCHEMA import;

    -- Step 4: Create actual tables with prisma
    -- op run --env-file="op.env" -- op run --env-file ".env" -- npx prisma db push

    -- Step 5: Copy data
    -- INSERT INTO public.file SELECT * FROM import.file;
    -- INSERT INTO public.tag SELECT * FROM import.tag;
    -- INSERT INTO public.screenshot_file SELECT * FROM import.screenshotfile;
    -- INSERT INTO public.screenshot_tag SELECT * FROM import.screenshottag;
    -- INSERT INTO public.screenshot_timecode SELECT * FROM import.screenshottimecode;
    -- INSERT INTO public.tags_on_files SELECT * FROM import.tagsonfiles;
    -- INSERT INTO public.timecodes_on_files SELECT * FROM import.timecodesonfiles;
    -- INSERT INTO public.tags_on_timecodes SELECT * FROM import.tagsontimecodes;

    -- Remove temp tables loaded from SQLite:
    -- DROP TABLE import.screenshotfile;
    -- DROP TABLE import.screenshottag;
    -- DROP TABLE import.screenshottimecode;
    -- DROP TABLE import.tagsonfiles;
    -- DROP TABLE import.tagsontimecodes;
    -- DROP TABLE import.timecodesonfiles;
    -- DROP TABLE import.file;
    -- DROP TABLE import.tag;

    -- Remove tables generated with Prisma:
    -- DROP TABLE public.screenshot_file;
    -- DROP TABLE public.screenshot_tag;
    -- DROP TABLE public.screenshot_timecode;
    -- DROP TABLE public.tags_on_files;
    -- DROP TABLE public.tags_on_timecodes;
    -- DROP TABLE public.timecodes_on_files;
    -- DROP TABLE public.file;
    -- DROP TABLE public.tag;
