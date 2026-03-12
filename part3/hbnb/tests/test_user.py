import unittest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app


class TestUserEndpoints(unittest.TestCase):
    def setUp(self):
        """Initialise le client de test avant chaque test"""
        self.app = create_app()
        self.client = self.app.test_client()
        self.app.testing = True

    def test_create_user(self):
        """Test de la création d'un user valide"""
        response = self.client.post('/api/v1/users/', json={
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice@example.com"
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertEqual(data.get("first_name"), "Alice")

    def test_create_user_invalid(self):
        """Test de la création d'un user sans données"""
        response = self.client.post('/api/v1/users/', json={})
        self.assertEqual(response.status_code, 400)

    def test_create_user_invalid_email(self):
        """Test de la création d'un user avec email invalide"""
        response = self.client.post('/api/v1/users/', json={
            "first_name": "Bob",
            "last_name": "Martin",
            "email": "notanemail"
        })
        self.assertEqual(response.status_code, 400)

    def test_get_all_users(self):
        """Test de récupération de tous les users"""
        response = self.client.get('/api/v1/users/')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)

    def test_get_user_by_id(self):
        """Test de récupération d'un user par ID"""
        # Créer un user
        create_response = self.client.post('/api/v1/users/', json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test@test.com"
        })
        user_id = create_response.get_json()["id"]

        # Récupérer le user
        response = self.client.get(f'/api/v1/users/{user_id}')
        self.assertEqual(response.status_code, 200)

    def test_get_user_not_found(self):
        """Test de récupération d'un user inexistant"""
        response = self.client.get('/api/v1/users/fake-id-123')
        self.assertEqual(response.status_code, 404)

    def test_update_user(self):
        """Test de modification d'un user"""
        # Créer un user
        create_response = self.client.post('/api/v1/users/', json={
            "first_name": "Update",
            "last_name": "Test",
            "email": "update@test.com"
        })
        user_id = create_response.get_json()["id"]

        # Modifier le user
        response = self.client.put(f'/api/v1/users/{user_id}', json={
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated@test.com"
        })
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()