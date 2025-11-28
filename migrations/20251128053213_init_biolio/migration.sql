-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "reputation" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "molecules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "smiles" TEXT,
    "inchi" TEXT,
    "formula" TEXT,
    "weight" REAL,
    "structure" TEXT,
    "properties" TEXT,
    "object_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "molecules_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proteins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequence" TEXT,
    "pdbId" TEXT,
    "metadata" TEXT,
    "chains" TEXT,
    "object_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "proteins_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reactionString" TEXT,
    "data" TEXT,
    "object_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reactions_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "articles" (
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
    CONSTRAINT "articles_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "objects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "current_version_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "objects_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "object_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "object_versions" (
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
    CONSTRAINT "object_versions_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "moderation_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version_id" TEXT NOT NULL,
    "moderator_id" TEXT,
    "decision" TEXT,
    "notes" TEXT,
    "reviewed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moderation_queue_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "moderation_queue_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "object_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "version_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "comment" TEXT,
    "reputation_value" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "version_reviews_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "object_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "version_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "moderation_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approval_threshold" INTEGER NOT NULL DEFAULT 1,
    "rejection_threshold" INTEGER NOT NULL DEFAULT 1,
    "min_reviews_required" INTEGER NOT NULL DEFAULT 1,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "molecules_object_id_key" ON "molecules"("object_id");

-- CreateIndex
CREATE UNIQUE INDEX "proteins_object_id_key" ON "proteins"("object_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_object_id_key" ON "reactions"("object_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_object_id_key" ON "articles"("object_id");

-- CreateIndex
CREATE UNIQUE INDEX "objects_current_version_id_key" ON "objects"("current_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_queue_version_id_key" ON "moderation_queue"("version_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_reviews_version_id_user_id_key" ON "version_reviews"("version_id", "user_id");
