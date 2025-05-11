import numpy as np

# Tập các giá trị hợp lệ cố định
options = {
    "season": ['spring', 'summer', 'autumn', 'winter'],
    "occasion": ['daily', 'school', 'work', 'party', 'date', 'formal', 'travel', 'wedding', 'beach', 'home', 'sport', 'special', 'etc'],
    "color": ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'ivory', 'beige', 'light gray', 'dark gray', 'light yellow', 'orange', 'coral', 'hot pink', 'light green', 'sky blue', 'navy', 'brown', 'dark-brown', 'gold', 'silver', 'purple', 'camel', 'colorful'],
    "material": ['denim', 'linen', 'cotton', 'leather', 'wool', 'polyester', 'nylon', 'spandex', 'acrylic', 'silk', 'rayon', 'viscose', 'other material'],
    "pattern": ['solid', 'striped', 'plaid', 'polka dot', 'floral', 'checkerboard', 'argyle', 'color-block', 'gingham', 'repeated', 'geometric', 'other pattern'],
    "style": ['casual', 'sporty', 'formal', 'vintage', 'streetwear', 'comfortable', 'business casual', 'trendy', 'modern', 'classic', 'minimalist', 'bohemian', 'luxury', 'athleisure', 'affordable', 'premium', 'kidcore', 'basic', 'artic', 'dress-up', 'hipster', 'feminine', 'chic', 'punk', 'kitsch', 'etc'],
    "gender": ['man', 'woman', 'unisex'],
    "categoryParent": ['dresses', 'tops', 'pants', 'skirts', 'outerwear', 'shoes', 'bags', 'headwear', 'jewelry', 'other'],
}

# Tạo mapping one-hot cho từng loại
def encode_list(input_list, valid_values):
    vec = np.zeros(len(valid_values))
    for val in input_list:
        if val in valid_values:
            vec[valid_values.index(val)] = 1
    return vec

# Encode item
def create_embedding(item):
    season_vec = encode_list(item.get("season", []), options["season"])
    occasion_vec = encode_list(item.get("occasion", []), options["occasion"])
    color_vec = encode_list(item.get("color", []), options["color"])
    material_vec = encode_list(item.get("material", []), options["material"])
    pattern_vec = encode_list(item.get("pattern", []), options["pattern"])
    style_vec = encode_list(item.get("style", []), options["style"])
    gender_vec = encode_list([item.get("gender", "unisex")], options["gender"])

    category_parent = item.get("category", {}).get("parent", "other")
    category_vec = encode_list([category_parent], options["categoryParent"])

    return np.concatenate([
        season_vec,
        occasion_vec,
        color_vec,
        material_vec,
        pattern_vec,
        style_vec,
        gender_vec,
        category_vec
    ])
