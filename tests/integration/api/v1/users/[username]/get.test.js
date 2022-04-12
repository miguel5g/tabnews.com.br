import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('Retrieving non-existing user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist`);

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.statusCode).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(responseBody.statusCode).toEqual(404);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving too short user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/ab`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.statusCode).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no mínimo 3 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.errorUniqueCode).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving too long user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userWith31Characterssssssssssss`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.statusCode).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no máximo 30 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.errorUniqueCode).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving user with invalid characters', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/<script>alert("xss")`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.statusCode).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.errorUniqueCode).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving existing user using same capital letters', async () => {
      const userCreated = await orchestrator.createUser({
        username: 'userNameToBeFound',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userNameToBeFound`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(userCreated.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('userNameToBeFound');
      expect(responseBody.features).toEqual(userCreated.features);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('email');
    });

    test('Retrieving existing user using different capital letters', async () => {
      const userCreated = await orchestrator.createUser({
        username: 'userNameToBeFoundCAPS',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/usernametobefoundcaps`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(userCreated.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('userNameToBeFoundCAPS');
      expect(responseBody.features).toEqual(['read:activation_token']);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('email');
    });
  });
});
