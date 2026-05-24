import numpy as np
from src.models.two_tower import HAS_TORCH

class DeepRankingStage:
    def __init__(self, transformer_net, items_db):
        """
        transformer_net: TransformerSequenceNet (PyTorch or NumPy fallback)
        items_db: Dict mapping item_id -> item dict details
        """
        self.transformer_net = transformer_net
        self.items_db = {it['id']: it for it in items_db}
        
    def rank_candidates(self, candidates, user_profile, user_vector, top_k=20):
        """
        candidates: Top 100 retrieved candidate items from vector search
        user_profile: User dict detailing historical sequence
        user_vector: Unit L2 vector projected by UserTower
        """
        # --- 1. Transformer Sequence Behavioral modeling ---
        seq_history_ids = user_profile.get('sequence_history', [])
        
        # Fetch sequence embeddings from DB
        seq_embs = []
        for item_id in seq_history_ids:
            if item_id in self.items_db:
                seq_embs.append(self.items_db[item_id]['embedding'])
                
        # If sequence is empty, pad with user's own base preference vector
        if not seq_embs:
            seq_embs = [user_profile['embedding']] * 5
            
        seq_embs = seq_embs[-10:] # Bound sequence length to last 10 items
        
        # Feed through Transformer sequence attention model
        if HAS_TORCH:
            # Handle PyTorch forward
            import torch
            with torch.no_grad():
                seq_t = torch.tensor([seq_embs], dtype=torch.float32)
                forecasted_vec = self.transformer_net(seq_t).numpy()[0]
            # Mock average attention weights for PyTorch
            attn_weights = [0.125] * 8
        else:
            # Handle NumPy Fallback dot-product attention
            forecasted_vec, attn_weights = self.transformer_net.forward(seq_embs)
            
        f_vec = np.array(forecasted_vec) # [LatentDim]
        
        # --- 2. Context-Aware Feature-Cross calculations ---
        ranked_list = []
        for item in candidates:
            item_vec = np.array(item['embedding'])
            
            # A: Dot product with sequence forecasted vector (Sequence similarity score)
            seq_similarity = float(np.dot(f_vec, item_vec))
            
            # B: Category Feature Cross (User preference match multiplier)
            pref_match = 1.0 if item['category'] == user_profile['preferred_category'] else 0.2
            
            # C: Device Cross Interaction (Simulated deep feature cross multiplication)
            # Some category products fit better on specific viewing devices!
            device = user_profile['device']
            device_bonus = 1.0
            if device == 'Holo Glass' and item['category'] == 'Holo-Tech':
                device_bonus = 1.25
            elif device == 'Neural Jack' and item['category'] == 'Implants':
                device_bonus = 1.25
            elif device == 'Cyborg Deck' and item['category'] == 'Software':
                device_bonus = 1.20
                
            context_cross_score = pref_match * device_bonus * item['popularity']
            
            # D: Unified Hybrid Ranking Score
            # 50% Two-Tower dot-product match, 35% sequence attention match, 15% context crosses
            hybrid_score = (0.50 * item['base_similarity'] + 
                            0.35 * seq_similarity + 
                            0.15 * context_cross_score)
            
            item_copy = dict(item)
            item_copy['seq_sim'] = seq_similarity
            item_copy['context_score'] = context_cross_score
            item_copy['ranking_score'] = float(hybrid_score)
            
            ranked_list.append(item_copy)
            
        # Sort candidates based on ranking_score
        ranked_list.sort(key=lambda x: x['ranking_score'], reverse=True)
        
        # Return top K ranked candidate list and transformer head weights
        return ranked_list[:top_k], attn_weights
