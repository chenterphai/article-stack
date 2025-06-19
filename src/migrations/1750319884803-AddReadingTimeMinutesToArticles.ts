import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReadingTimeMinutesToArticles1750319884803 implements MigrationInterface {
    name = 'AddReadingTimeMinutesToArticles1750319884803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "fa_comments" ("id" BIGSERIAL NOT NULL, "content" text NOT NULL, "creationtime" TIMESTAMP NOT NULL DEFAULT now(), "updatetime" TIMESTAMP NOT NULL DEFAULT now(), "authorId" bigint NOT NULL, "articleId" bigint NOT NULL, CONSTRAINT "PK_40cffdda7546bffec2f26efb942" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fa_articles" ("id" BIGSERIAL NOT NULL, "title" character varying(200) NOT NULL, "content" text, "slug" character varying(255) NOT NULL, "thumbnail" text, "status" integer NOT NULL DEFAULT '0', "creationtime" TIMESTAMP NOT NULL DEFAULT now(), "updatetime" TIMESTAMP NOT NULL DEFAULT now(), "readingTimeMinutes" integer, "authorId" bigint NOT NULL, CONSTRAINT "UQ_faa1a212cf65efa772189795f92" UNIQUE ("slug"), CONSTRAINT "PK_c2ba2a4178e8979a01c1d9fb49d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."fa_users_gender_enum" AS ENUM('male', 'female', 'other')`);
        await queryRunner.query(`CREATE TABLE "fa_users" ("id" BIGSERIAL NOT NULL, "username" character varying(20), "email" character varying(50) NOT NULL, "password" character varying NOT NULL, "nickname" character varying(50), "avatar" text, "gender" "public"."fa_users_gender_enum" NOT NULL DEFAULT 'other', "role" text NOT NULL DEFAULT 'user', "creationtime" TIMESTAMP NOT NULL DEFAULT now(), "updatetime" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8ca87ecbdcc3f13ee58854ce4f9" UNIQUE ("username"), CONSTRAINT "UQ_09d80e4e0182c35d251725bba38" UNIQUE ("email"), CONSTRAINT "PK_0358c18da62d27b0fadc3563fcd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "fa_comments" ADD CONSTRAINT "FK_71cc3beea8cb30421e9298f6430" FOREIGN KEY ("authorId") REFERENCES "fa_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fa_comments" ADD CONSTRAINT "FK_69201159d54bfed52437a3c27a7" FOREIGN KEY ("articleId") REFERENCES "fa_articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fa_articles" ADD CONSTRAINT "FK_e4a59a32f38b43b3e6e4c0abd29" FOREIGN KEY ("authorId") REFERENCES "fa_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fa_articles" DROP CONSTRAINT "FK_e4a59a32f38b43b3e6e4c0abd29"`);
        await queryRunner.query(`ALTER TABLE "fa_comments" DROP CONSTRAINT "FK_69201159d54bfed52437a3c27a7"`);
        await queryRunner.query(`ALTER TABLE "fa_comments" DROP CONSTRAINT "FK_71cc3beea8cb30421e9298f6430"`);
        await queryRunner.query(`DROP TABLE "fa_users"`);
        await queryRunner.query(`DROP TYPE "public"."fa_users_gender_enum"`);
        await queryRunner.query(`DROP TABLE "fa_articles"`);
        await queryRunner.query(`DROP TABLE "fa_comments"`);
    }

}
