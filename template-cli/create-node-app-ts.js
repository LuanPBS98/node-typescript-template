#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function askQuestions() {
  const questions = [
    {
      type: 'list',
      name: 'framework',
      message: 'Qual framework web você quer usar?',
      choices: ['express', 'fastify', 'nestjs'],
    },
    {
      type: 'list',
      name: 'database',
      message: 'Qual banco de dados você quer usar?',
      choices: ['none', 'mongodb', 'postgresql', 'mysql'],
    },
    {
      type: 'list',
      name: 'orm',
      message: 'Qual ORM você quer usar?',
      choices: (answers) => {
        if (answers.database === 'mongodb') {
          return ['mongoose'];
        }
        return ['none', 'prisma', 'typeorm', 'sequelize', 'knex'];
      },
    },
  ];
  return inquirer.prompt(questions);
}

const dependencyMap = {
  framework: {
    express: ['express', '@types/express', 'cors'],
    fastify: ['fastify', '@fastify/cors'],
    nestjs: ['@nestjs/core', '@nestjs/common', '@nestjs/platform-express'],
  },
  database: {
    mongodb: ['mongodb'],
    postgresql: ['pg'],
    mysql: ['mysql2'],
  },
  orm: {
    mongoose: ['mongoose'],
    prisma: ['prisma', '@prisma/client'],
    typeorm: ['typeorm', 'reflect-metadata'],
    sequelize: ['sequelize', 'sequelize-typescript'],
    knex: ['knex'],
  },
};

const devDependencyMap = {
  orm: {
    prisma: ['ts-node', 'ts-node-dev'],
    typeorm: ['ts-node', 'ts-node-dev'],
    sequelize: ['ts-node', 'ts-node-dev'],
    knex: ['knex'],
  },
};

async function generateProject(answers) {
  const { framework, database, orm } = answers;

  console.log(`\nConfigurando projeto com ${framework}...`);

  const projectDir = process.cwd();

  const packageJsonPath = path.join(projectDir, 'package.json');
  let packageJsonContent = {};
  try {
    const packageJsonFile = await fs.readFile(packageJsonPath, 'utf8');
    packageJsonContent = JSON.parse(packageJsonFile);
  } catch (error) {
    console.error('Erro: package.json não encontrado no diretório atual. Execute o script na raiz do projeto.');
    process.exit(1);
  }

  let dependenciesToInstall = [];
  let devDependenciesToInstall = [];

  dependenciesToInstall.push(...(dependencyMap.framework[framework] || []));
  if (database !== 'none') {
    dependenciesToInstall.push(...(dependencyMap.database[database] || []));
  }
  if (orm !== 'none') {
    dependenciesToInstall.push(...(dependencyMap.orm[orm] || []));
    devDependenciesToInstall.push(...(devDependencyMap.orm[orm] || []));
  }

  if (orm === 'sequelize') {
    dependenciesToInstall.push(database === 'postgresql' ? 'pg' : 'mysql2');
  }

  await fs.writeFile(path.join(projectDir, '.env'), `DATABASE_URL=`);

  const srcDir = path.join(projectDir, 'src');
  await fs.mkdir(srcDir, { recursive: true });

  if (database !== 'none') {
    const configDir = path.join(srcDir, 'config');
    await fs.mkdir(configDir, { recursive: true });

    if (orm === 'mongoose') {
      await fs.writeFile(path.join(configDir, 'database.ts'), `import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB conectado...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;`);
    }
  }

  if (orm === 'prisma') {
    await fs.mkdir(path.join(projectDir, 'prisma'), { recursive: true });
    await fs.writeFile(path.join(projectDir, 'prisma', 'schema.prisma'), `datasource db {
  provider = "${database}"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}`);
  }

  if (dependenciesToInstall.length > 0) {
    console.log(`\nInstalando dependências...`);
    execSync(`yarn add ${dependenciesToInstall.join(' ')}`, { stdio: 'inherit', cwd: projectDir });
  }

  if (devDependenciesToInstall.length > 0) {
    console.log(`\nInstalando dependências de desenvolvimento...`);
    execSync(`yarn add --dev ${devDependenciesToInstall.join(' ')}`, { stdio: 'inherit', cwd: projectDir });
  }

  console.log('\n✅ Projeto configurado com sucesso!');
  console.log('Execute `yarn dev` para começar a desenvolver!');
}

async function main() {
  try {
    const answers = await askQuestions();
    await generateProject(answers);
  } catch (error) {
    console.error('Ocorreu um erro:', error);
  }
}

main();