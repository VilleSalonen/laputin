-- CreateTable
CREATE TABLE "file" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "active" INTEGER NOT NULL,
    "size" BIGINT NOT NULL,
    "metadata" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenshot_file" (
    "id" SERIAL NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "screenshot_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenshot_tag" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "screenshot_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenshot_timecode" (
    "id" SERIAL NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "screenshot_timecode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_on_files" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "tags_on_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_on_timecodes" (
    "id" SERIAL NOT NULL,
    "timecodeId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "tags_on_timecodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timecodes_on_files" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "start" DOUBLE PRECISION NOT NULL,
    "end" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "timecodes_on_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_hash_key" ON "file"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "file_path_key" ON "file"("path");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE INDEX "TagsOnFiles_tagId" ON "tags_on_files"("tagId");

-- CreateIndex
CREATE INDEX "TagsOnFiles_fileId" ON "tags_on_files"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_TagsOnFiles_1" ON "tags_on_files"("fileId", "tagId");

-- AddForeignKey
ALTER TABLE "screenshot_tag" ADD CONSTRAINT "screenshot_tag_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "screenshot_tag" ADD CONSTRAINT "screenshot_tag_id_fkey" FOREIGN KEY ("id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_files" ADD CONSTRAINT "tags_on_files_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_files" ADD CONSTRAINT "tags_on_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_timecodes" ADD CONSTRAINT "tags_on_timecodes_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_timecodes" ADD CONSTRAINT "tags_on_timecodes_timecodeId_fkey" FOREIGN KEY ("timecodeId") REFERENCES "timecodes_on_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timecodes_on_files" ADD CONSTRAINT "timecodes_on_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
