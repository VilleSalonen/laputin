create table file
(
    id       serial
        primary key,
    hash     text    not null,
    path     text    not null,
    active   integer not null,
    size     bigint  not null,
    metadata jsonb   not null,
    type     text    not null
);

alter table file
    owner to laputin_admin;

create unique index file_hash_key
    on file (hash);

create unique index file_path_key
    on file (path);

create table screenshot_file
(
    id   serial
        primary key,
    time double precision not null
);

alter table screenshot_file
    owner to laputin_admin;

create table screenshot_timecode
(
    id   serial
        primary key,
    time double precision not null
);

alter table screenshot_timecode
    owner to laputin_admin;

create table tag
(
    id   serial
        primary key,
    name text not null
);

alter table tag
    owner to laputin_admin;

create table screenshot_tag
(
    id      serial
        primary key
        references tag,
    file_id integer          not null
        references file,
    time    double precision not null
);

alter table screenshot_tag
    owner to laputin_admin;

create unique index tag_name_key
    on tag (name);

create table tags_on_files
(
    id      serial
        primary key,
    file_id integer not null
        references file,
    tag_id  integer not null
        references tag
);

alter table tags_on_files
    owner to laputin_admin;

create index tags_on_files_file_id_idx
    on tags_on_files (file_id);

create unique index tags_on_files_file_id_tag_id_key
    on tags_on_files (file_id, tag_id);

create index tags_on_files_tag_id_idx
    on tags_on_files (tag_id);

create table timecodes_on_files
(
    id      serial
        primary key,
    file_id integer          not null
        references file,
    start   double precision not null,
    "end"   double precision not null
);

alter table timecodes_on_files
    owner to laputin_admin;

create table tags_on_timecodes
(
    id          serial
        primary key,
    timecode_id integer not null
        references timecodes_on_files,
    tag_id      integer not null
        references tag
);

alter table tags_on_timecodes
    owner to laputin_admin;


