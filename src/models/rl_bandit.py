import numpy as np

class ContextualBandit:
    def __init__(self, categories=None, latent_dim=64):
        if categories is None:
            categories = ['Cyberwear', 'Implants', 'Holo-Tech', 'Software']
        self.categories = categories
        self.latent_dim = latent_dim
        
        # --- Multi-Armed Bandit States ---
        self.total_steps = 1
        # Q-value running averages for each category (estimated reward averages)
        self.q_values = {cat: 0.75 for cat in categories}
        # Count of times each category was chosen
        self.counts = {cat: 0 for cat in categories}
        
    def select_and_rerank(self, candidates, user_embedding, exploration_eps=0.35):
        """
        candidates: List of item dictionaries
        user_embedding: List vector of shape [latent_dim]
        exploration_eps: Float balancing Exploitation (0) vs Exploration (1)
        """
        self.total_steps += 1
        reranked = []
        
        u_vec = np.array(user_embedding)
        
        for item in candidates:
            # 1. Base Cosine Similarity score from Two-Tower model
            i_vec = np.array(item['embedding'])
            cos_sim = float(np.dot(u_vec, i_vec))
            
            # 2. Extract Category parameters
            cat = item['category']
            cat_count = self.counts.get(cat, 0)
            cat_q = self.q_values.get(cat, 0.5)
            
            # 3. UCB formula (Upper Confidence Bound)
            # Standard reward bonus for low-visit categories scaled by exploration parameter
            exploration_bonus = np.sqrt((2 * np.log(self.total_steps) + 1) / (cat_count + 1))
            
            # Weighted hybrid score combining deep matching, RL history, and novelty explorer
            exploit_score = cos_sim * 0.75 + cat_q * 0.25
            explore_score = exploration_bonus * 0.35
            
            # Combine based on UI Epsilon slider
            final_score = (1 - exploration_eps) * exploit_score + exploration_eps * explore_score
            
            # Inject simulated noise to simulate online traffic stochasticity
            final_score += np.random.normal(0, 0.02)
            
            # Store decision details inside item to build Explainability traces!
            item_copy = dict(item)
            item_copy['score'] = float(final_score)
            item_copy['cos_sim'] = cos_sim
            item_copy['rl_exploit_value'] = exploit_score
            item_copy['rl_explore_value'] = explore_score
            
            reranked.append(item_copy)
            
        # Sort by ranked scores descending
        reranked.sort(key=lambda x: x['score'], reverse=True)
        return reranked

    def update_policy(self, category, click=0, watch_time=0.0, purchased=0):
        """
        Closed-loop update of Multi-Armed Bandit using dynamic online rewards
        Reward formula: R = Click * 1.0 + WatchTime * 0.2 + Purchase * 5.0
        """
        if category not in self.categories:
            return 0.0
            
        # Calculate multi-objective reward
        reward = float(click * 1.0 + watch_time * 0.2 + purchased * 5.0)
        
        # Incremental update of running average Q-value: Q_n = Q_n-1 + 1/n * (R - Q_n-1)
        self.counts[category] += 1
        n = self.counts[category]
        self.q_values[category] += (reward - self.q_values[category]) / n
        
        return reward

if __name__ == '__main__':
    bandit = ContextualBandit()
    # Mock update
    r = bandit.update_policy('Cyberwear', click=1, watch_time=30.0, purchased=0)
    print(f"Updated policy. Reward: {r}, Q-Values: {bandit.q_values}")
