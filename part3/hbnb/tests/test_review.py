import unittest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app


class TestReviewEndpoints(unittest.TestCase):
    def setUp(self):
        """Initialise le client de test avant chaque test"""
        self.app = create_app()
        self.client = self.app.test_client()
        self.app.testing = True

        # Créer un user
        user_response = self.client.post('/api/v1/users/', json={
            "first_name": "Reviewer",
            "last_name": "Test",
            "email": "reviewer@test.com"
        })
        print("\n=== USER CREATION DEBUG ===")
        print("Status:", user_response.status_code)
        print("Data:", user_response.get_json())
        print("===========================\n")
        self.user_id = user_response.get_json()["id"]

        # Créer une place
        place_response = self.client.post('/api/v1/places/', json={
            "title": "Test Place",
            "price": 100,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.user_id
        })
        self.place_id = place_response.get_json()["id"]

    def test_create_review(self):
        """Test de la création d'une review valide"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Excellent séjour!",
            "rating": 5,
            "user_id": self.user_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertEqual(data.get("rating"), 5)

    def test_create_review_invalid(self):
        """Test de la création d'une review sans données"""
        response = self.client.post('/api/v1/reviews/', json={})
        self.assertEqual(response.status_code, 400)

    def test_create_review_invalid_user(self):
        """Test de la création d'une review avec user_id invalide"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Test",
            "rating": 5,
            "user_id": "fake-id",
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_review_invalid_rating(self):
        """Test de la création d'une review avec rating invalide"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Test",
            "rating": 0,
            "user_id": self.user_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 400)

    def test_get_all_reviews(self):
        """Test de récupération de toutes les reviews"""
        response = self.client.get('/api/v1/reviews/')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)

    def test_get_review_by_id(self):
        """Test de récupération d'une review par ID"""
        # Créer une review
        create_response = self.client.post('/api/v1/reviews/', json={
            "text": "Test review",
            "rating": 4,
            "user_id": self.user_id,
            "place_id": self.place_id
        })
        review_id = create_response.get_json()["id"]

        # Récupérer la review
        response = self.client.get(f'/api/v1/reviews/{review_id}')
        self.assertEqual(response.status_code, 200)

    def test_get_review_not_found(self):
        """Test de récupération d'une review inexistante"""
        response = self.client.get('/api/v1/reviews/fake-id-123')
        self.assertEqual(response.status_code, 404)

    def test_update_review(self):
        """Test de modification d'une review"""
        # Créer une review
        create_response = self.client.post('/api/v1/reviews/', json={
            "text": "Old review",
            "rating": 3,
            "user_id": self.user_id,
            "place_id": self.place_id
        })
        review_id = create_response.get_json()["id"]

        # Modifier la review
        response = self.client.put(f'/api/v1/reviews/{review_id}', json={
            "text": "Updated review",
            "rating": 5,
            "user_id": self.user_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 200)

    def test_delete_review(self):
        """Test de suppression d'une review"""
        # Créer une review
        create_response = self.client.post('/api/v1/reviews/', json={
            "text": "To delete",
            "rating": 3,
            "user_id": self.user_id,
            "place_id": self.place_id
        })
        review_id = create_response.get_json()["id"]

        # Supprimer la review
        response = self.client.delete(f'/api/v1/reviews/{review_id}')
        self.assertEqual(response.status_code, 200)

        # Vérifier que la review n'existe plus
        get_response = self.client.get(f'/api/v1/reviews/{review_id}')
        self.assertEqual(get_response.status_code, 404)

    def test_get_reviews_by_place(self):
        """Test de récupération des reviews d'une place"""
        response = self.client.get(f'/api/v1/places/{self.place_id}/reviews')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)


if __name__ == "__main__":
    unittest.main()
