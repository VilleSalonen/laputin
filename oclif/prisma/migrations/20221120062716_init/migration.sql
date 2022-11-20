-- CreateTable
CREATE TABLE "file" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "active" INTEGER NOT NULL,
    "size" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL,
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
    "file_id" INTEGER NOT NULL,
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
    "file_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "tags_on_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_on_timecodes" (
    "id" SERIAL NOT NULL,
    "timecode_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "tags_on_timecodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timecodes_on_files" (
    "id" SERIAL NOT NULL,
    "file_id" INTEGER NOT NULL,
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
CREATE INDEX "tags_on_files_tag_id_idx" ON "tags_on_files"("tag_id");

-- CreateIndex
CREATE INDEX "tags_on_files_file_id_idx" ON "tags_on_files"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_on_files_file_id_tag_id_key" ON "tags_on_files"("file_id", "tag_id");

-- AddForeignKey
ALTER TABLE "screenshot_tag" ADD CONSTRAINT "screenshot_tag_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "screenshot_tag" ADD CONSTRAINT "screenshot_tag_id_fkey" FOREIGN KEY ("id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_files" ADD CONSTRAINT "tags_on_files_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_files" ADD CONSTRAINT "tags_on_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_timecodes" ADD CONSTRAINT "tags_on_timecodes_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags_on_timecodes" ADD CONSTRAINT "tags_on_timecodes_timecode_id_fkey" FOREIGN KEY ("timecode_id") REFERENCES "timecodes_on_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timecodes_on_files" ADD CONSTRAINT "timecodes_on_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
