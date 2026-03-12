import unittest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app


class TestPlaceEndpoints(unittest.TestCase):
    def setUp(self):
        """Initialise le client de test avant chaque test"""
        self.app = create_app()
        self.client = self.app.test_client()
        self.app.testing = True

        # Créer un user pour les tests
        user_response = self.client.post('/api/v1/users/', json={
            "first_name": "Owner",
            "last_name": "Test",
            "email": "owner@test.com"
        })
        self.owner_id = user_response.get_json()["id"]

    def test_create_place(self):
        """Test de la création d'une place valide"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Appart Paris",
            "price": 100,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertEqual(data.get("title"), "Appart Paris")

    def test_create_place_invalid(self):
        """Test de la création d'une place sans données"""
        response = self.client.post('/api/v1/places/', json={})
        self.assertEqual(response.status_code, 400)

    def test_create_place_negative_price(self):
        """Test de la création d'une place avec prix négatif"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Test",
            "price": -50,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_get_all_places(self):
        """Test de récupération de toutes les places"""
        response = self.client.get('/api/v1/places/')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)

    def test_get_place_by_id(self):
        """Test de récupération d'une place par ID"""
        # Créer une place
        create_response = self.client.post('/api/v1/places/', json={
            "title": "Test Place",
            "price": 100,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        place_id = create_response.get_json()["id"]

        # Récupérer la place
        response = self.client.get(f'/api/v1/places/{place_id}')
        self.assertEqual(response.status_code, 200)

    def test_get_place_not_found(self):
        """Test de récupération d'une place inexistante"""
        response = self.client.get('/api/v1/places/fake-id-123')
        self.assertEqual(response.status_code, 404)

    def test_update_place(self):
        """Test de modification d'une place"""
        # Créer une place
        create_response = self.client.post('/api/v1/places/', json={
            "title": "Old Title",
            "price": 100,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        place_id = create_response.get_json()["id"]

        # Modifier la place
        response = self.client.put(f'/api/v1/places/{place_id}', json={
            "title": "New Title",
            "price": 150
        })
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()