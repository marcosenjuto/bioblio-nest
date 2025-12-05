/*
  Warnings:

  - You are about to drop the `objects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `properties` on the `molecules` table. All the data in the column will be lost.
  - You are about to drop the column `structure` on the `molecules` table. All the data in the column will be lost.
  - You are about to drop the column `chains` on the `proteins` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `proteins` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `reactions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "objects_current_version_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "objects";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "bio_entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "current_version_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bio_entities_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "object_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "tags" TEXT,
    "author_id" TEXT NOT NULL,
    "object_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "articles_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "bio_entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_articles" ("author_id", "content", "created_at", "id", "object_id", "slug", "summary", "tags", "title", "updated_at") SELECT "author_id", "content", "created_at", "id", "object_id", "slug", "summary", "tags", "title", "updated_at" FROM "articles";
DROP TABLE "articles";
ALTER TABLE "new_articles" RENAME TO "articles";
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
CREATE UNIQUE INDEX "articles_object_id_key" ON "articles"("object_id");
CREATE TABLE "new_molecules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "iupac_name" TEXT,
    "description" TEXT,
    "type" TEXT,
    "cid" INTEGER,
    "cas" TEXT,
    "chembl_id" TEXT,
    "smiles" TEXT,
    "inchi" TEXT,
    "formula" TEXT,
    "weight" REAL,
    "names_json" TEXT,
    "structure_json" TEXT,
    "properties_json" TEXT,
    "object_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "molecules_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "bio_entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_molecules" ("created_at", "description", "formula", "id", "inchi", "name", "object_id", "smiles", "updated_at", "weight") SELECT "created_at", "description", "formula", "id", "inchi", "name", "object_id", "smiles", "updated_at", "weight" FROM "molecules";
DROP TABLE "molecules";
ALTER TABLE "new_molecules" RENAME TO "molecules";
CREATE UNIQUE INDEX "molecules_object_id_key" ON "molecules"("object_id");
CREATE TABLE "new_object_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "object_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_fields" TEXT,
    "previous_data_json" TEXT,
    CONSTRAINT "object_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "object_versions_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "bio_entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_object_versions" ("changed_fields", "comment", "created_at", "data_json", "id", "object_id", "previous_data_json", "status", "user_id") SELECT "changed_fields", "comment", "created_at", "data_json", "id", "object_id", "previous_data_json", "status", "user_id" FROM "object_versions";
DROP TABLE "object_versions";
ALTER TABLE "new_object_versions" RENAME TO "object_versions";
CREATE TABLE "new_proteins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "sequence" TEXT,
    "pdbId" TEXT,
    "chains_json" TEXT,
    "metadata_json" TEXT,
    "details_json" TEXT,
    "object_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "proteins_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "bio_entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_proteins" ("created_at", "description", "id", "name", "object_id", "pdbId", "sequence", "updated_at") SELECT "created_at", "description", "id", "name", "object_id", "pdbId", "sequence", "updated_at" FROM "proteins";
DROP TABLE "proteins";
ALTER TABLE "new_proteins" RENAME TO "proteins";
CREATE UNIQUE INDEX "proteins_object_id_key" ON "proteins"("object_id");
CREATE TABLE "new_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reactionString" TEXT,
    "category" TEXT,
    "reactants_json" TEXT,
    "products_json" TEXT,
    "data_json" TEXT,
    "object_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reactions_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "bio_entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reactions" ("created_at", "description", "id", "name", "object_id", "reactionString", "updated_at") SELECT "created_at", "description", "id", "name", "object_id", "reactionString", "updated_at" FROM "reactions";
DROP TABLE "reactions";
ALTER TABLE "new_reactions" RENAME TO "reactions";
CREATE UNIQUE INDEX "reactions_object_id_key" ON "reactions"("object_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "bio_entities_current_version_id_key" ON "bio_entities"("current_version_id");
