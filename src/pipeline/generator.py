import numpy as np
import pandas as pd

class DatasetGenerator:
    def __init__(self, num_users=500, num_items=1000, latent_dim=64):
        self.num_users = num_users
        self.num_items = num_items
        self.latent_dim = latent_dim
        
    def generate(self):
        np.random.seed(42)
        
        # 1. Generate Items Database
        categories = ['Cyberwear', 'Implants', 'Holo-Tech', 'Software']
        items = []
        for i in range(self.num_items):
            cat = categories[i % len(categories)]
            # Generate random unit vector for shared latent space
            vec = np.random.randn(self.latent_dim)
            vec /= np.linalg.norm(vec)
            
            items.append({
                'id': f'product_{i + 100}',
                'name': f'{cat} Module #{i + 101}',
                'category': cat,
                'popularity': float(np.random.beta(2, 5)),
                'price': float(np.random.uniform(10, 500)),
                'embedding': vec.tolist()
            })
            
        # 2. Generate User Profiles
        users = []
        for i in range(self.num_users):
            # Prefer a specific category
            pref_cat = categories[np.random.randint(len(categories))]
            # User base preferences embedding
            vec = np.random.randn(self.latent_dim)
            vec /= np.linalg.norm(vec)
            
            users.append({
                'id': f'user_{i + 1000}',
                'preferred_category': pref_cat,
                'age': int(np.random.choice([18, 24, 30, 35, 45])),
                'device': np.random.choice(['Neural Jack', 'Cyborg Deck', 'Holo Glass']),
                'embedding': vec.tolist(),
                'sequence_history': []  # Will hold list of last item IDs
            })

        # 3. Seed User Sequence Histories with random category matches
        for u in users:
            history_len = np.random.randint(5, 12)
            preferred_items = [it['id'] for it in items if it['category'] == u['preferred_category']]
            # Fill with a mix of category items and random items
            seq = []
            for _ in range(history_len):
                if np.random.rand() < 0.7:
                    seq.append(np.random.choice(preferred_items))
                else:
                    seq.append(np.random.choice([it['id'] for it in items]))
            u['sequence_history'] = seq

        # 4. Generate Interaction Logs (ratings, clicks, watch time)
        interactions = []
        for _ in range(5000):
            u = np.random.choice(users)
            it = np.random.choice(items)
            
            # Click probability is dot product similarity + small random noise
            u_emb = np.array(u['embedding'])
            i_emb = np.array(it['embedding'])
            sim = float(np.dot(u_emb, i_emb))
            
            clicked = 1 if np.random.rand() < (sim * 0.5 + 0.3) else 0
            watch_time = float(np.random.exponential(120) * clicked) # seconds
            purchase_prob = float(sim * 0.2 + 0.1) if clicked else 0.0
            purchased = 1 if np.random.rand() < purchase_prob else 0
            
            interactions.append({
                'user_id': u['id'],
                'item_id': it['id'],
                'rating': int(np.random.choice([4, 5]) if clicked and watch_time > 45 else np.random.choice([1, 2, 3])),
                'clicked': clicked,
                'watch_time': watch_time,
                'purchased': purchased
            })
            
        return {
            'items': items,
            'users': users,
            'interactions': pd.DataFrame(interactions)
        }

if __name__ == '__main__':
    gen = DatasetGenerator()
    data = gen.generate()
    print(f"Generated {len(data['items'])} items, {len(data['users'])} users, {len(data['interactions'])} interaction logs.")
