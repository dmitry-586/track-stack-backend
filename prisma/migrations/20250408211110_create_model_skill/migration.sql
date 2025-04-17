-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Skill" (
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "progress" TEXT NOT NULL,
    "roadmapIds" TEXT[],

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("skillId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
