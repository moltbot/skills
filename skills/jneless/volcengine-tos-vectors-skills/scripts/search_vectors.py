#!/usr/bin/env python3
"""
Search vectors using TOS Vectors.

Example usage:
    python search_vectors.py "machine learning"
"""

import os
import sys
import tos


def generate_dummy_embedding(text, dimension=768):
    """Generate a dummy embedding for demonstration."""
    import hashlib
    hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
    return [(hash_val % 1000) / 1000.0] * dimension


def main():
    if len(sys.argv) < 2:
        print("Usage: python search_vectors.py <query>")
        sys.exit(1)

    query = sys.argv[1]

    # Get credentials
    ak = os.getenv('TOS_ACCESS_KEY')
    sk = os.getenv('TOS_SECRET_KEY')
    account_id = os.getenv('TOS_ACCOUNT_ID')

    if not all([ak, sk, account_id]):
        print("Error: Missing environment variables")
        sys.exit(1)

    # Configuration
    endpoint = 'https://tosvectors-cn-beijing.volces.com'
    region = 'cn-beijing'
    bucket_name = 'my-vectors'
    index_name = 'embeddings-768d'

    # Initialize client
    client = tos.VectorClient(ak, sk, endpoint, region)

    # Generate query embedding
    print(f"Searching for: {query}")
    query_embedding = generate_dummy_embedding(query)
    query_vector = tos.models2.VectorData(float32=query_embedding)

    # Search
    try:
        results = client.query_vectors(
            vector_bucket_name=bucket_name,
            account_id=account_id,
            index_name=index_name,
            query_vector=query_vector,
            top_k=5,
            return_distance=True,
            return_metadata=True
        )

        print(f"\nFound {len(results.vectors)} results:\n")
        for i, vec in enumerate(results.vectors):
            print(f"{i+1}. Key: {vec.key}")
            print(f"   Distance: {vec.distance:.4f}")
            print(f"   Similarity: {1 - vec.distance:.4f}")
            if vec.metadata:
                print(f"   Metadata: {vec.metadata}")
            print()

    except tos.exceptions.TosServerError as e:
        print(f"Error: {e.message}")
        sys.exit(1)


if __name__ == '__main__':
    main()
