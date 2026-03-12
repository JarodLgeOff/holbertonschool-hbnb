import unittest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app


class TestAmenityEndpoints(unittest.TestCase):
    def setUp(self):
        """Initialise le client de test avant chaque test"""
        self.app = create_app()
        self.client = self.app.test_client()
        self.app.testing = True

    def test_create_amenity(self):
        """Test de la création d'une amenity valide"""
        response = self.client.post('/api/v1/amenities/', json={"name": "WiFi"})
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertEqual(data.get("name"), "WiFi")

    def test_create_amenity_invalid(self):
        """Test de la création d'une amenity sans données"""
        response = self.client.post('/api/v1/amenities/', json={})
        self.assertEqual(response.status_code, 400)

    def test_create_amenity_empty_name(self):
        """Test de la création d'une amenity avec nom vide"""
        response = self.client.post('/api/v1/amenities/', json={"name": ""})
        self.assertEqual(response.status_code, 400)

    def test_get_all_amenities(self):
        """Test de récupération de toutes les amenities"""
        response = self.client.get('/api/v1/amenities/')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)

    def test_get_amenity_by_id(self):
        """Test de récupération d'une amenity par ID"""
        create_response = self.client.post('/api/v1/amenities/', json={"name": "Pool"})
        amenity_id = create_response.get_json()["id"]

        response = self.client.get(f'/api/v1/amenities/{amenity_id}')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["id"], amenity_id)

    def test_get_amenity_not_found(self):
        """Test de récupération d'une amenity inexistante"""
        response = self.client.get('/api/v1/amenities/fake-id-123')
        self.assertEqual(response.status_code, 404)

    def test_update_amenity(self):
        """Test de modification d'une amenity"""
        create_response = self.client.post('/api/v1/amenities/', json={"name": "Gym"})
        amenity_id = create_response.get_json()["id"]

        response = self.client.put(
            f'/api/v1/amenities/{amenity_id}',
            json={"name": "Fitness Center"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["name"], "Fitness Center")

    def test_update_amenity_not_found(self):
        """Test de modification d'une amenity inexistante"""
        response = self.client.put('/api/v1/amenities/fake-id-123', json={"name": "Test"})
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
