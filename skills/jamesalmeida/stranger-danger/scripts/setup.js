const inquirer = require('inquirer');
const bcrypt = require('bcrypt');
const { saveConfig } = require('./config');
const { setHash } = require('./keychain');

const SALT_ROUNDS = 12;

async function runSetup() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'question',
      message: 'Secret question:',
      validate: (value) => (value && value.trim() ? true : 'Question is required.'),
    },
    {
      type: 'password',
      name: 'answer',
      message: 'Secret answer (will be hidden):',
      mask: '*',
      validate: (value) => (value && value.trim() ? true : 'Answer is required.'),
    },
    {
      type: 'password',
      name: 'confirm',
      message: 'Confirm secret answer:',
      mask: '*',
      validate: (value, ctx) => (value === ctx.answer ? true : 'Answers do not match.'),
    },
  ]);

  const trimmedQuestion = answers.question.trim();
  const trimmedAnswer = answers.answer.trim();

  const hash = await bcrypt.hash(trimmedAnswer, SALT_ROUNDS);
  await setHash(hash);

  saveConfig({
    question: trimmedQuestion,
    createdAt: new Date().toISOString(),
  });
}

module.exports = {
  runSetup,
};
