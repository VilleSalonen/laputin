-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "active" INTEGER NOT NULL,
    "size" BIGINT NOT NULL,
    "metadata" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreenshotFile" (
    "id" SERIAL NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ScreenshotFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreenshotTag" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ScreenshotTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreenshotTimecode" (
    "id" SERIAL NOT NULL,
    "Time" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ScreenshotTimecode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnFiles" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "TagsOnFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnTimecodes" (
    "id" SERIAL NOT NULL,
    "timecodeId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "TagsOnTimecodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimecodesOnFiles" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "start" DOUBLE PRECISION NOT NULL,
    "end" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TimecodesOnFiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_File_1" ON "File"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_File_2" ON "File"("path");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_Tag_1" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "TagsOnFiles_tagId" ON "TagsOnFiles"("tagId");

-- CreateIndex
CREATE INDEX "TagsOnFiles_fileId" ON "TagsOnFiles"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_TagsOnFiles_1" ON "TagsOnFiles"("fileId", "tagId");

-- AddForeignKey
ALTER TABLE "ScreenshotTag" ADD CONSTRAINT "ScreenshotTag_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ScreenshotTag" ADD CONSTRAINT "ScreenshotTag_id_fkey" FOREIGN KEY ("id") REFERENCES "Tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TagsOnFiles" ADD CONSTRAINT "TagsOnFiles_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TagsOnFiles" ADD CONSTRAINT "TagsOnFiles_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TagsOnTimecodes" ADD CONSTRAINT "TagsOnTimecodes_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TagsOnTimecodes" ADD CONSTRAINT "TagsOnTimecodes_timecodeId_fkey" FOREIGN KEY ("timecodeId") REFERENCES "TimecodesOnFiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TimecodesOnFiles" ADD CONSTRAINT "TimecodesOnFiles_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
