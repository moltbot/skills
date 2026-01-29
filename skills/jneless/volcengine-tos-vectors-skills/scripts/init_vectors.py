#!/usr/bin/env python3
"""
Initialize TOS Vectors environment.

This script creates a vector bucket and index for getting started.
"""

import os
import sys
import tos


def main():
    # Get credentials from environment
    ak = os.getenv('TOS_ACCESS_KEY')
    sk = os.getenv('TOS_SECRET_KEY')
    account_id = os.getenv('TOS_ACCOUNT_ID')

    if not all([ak, sk, account_id]):
        print("Error: Missing required environment variables:")
        print("  TOS_ACCESS_KEY, TOS_SECRET_KEY, TOS_ACCOUNT_ID")
        sys.exit(1)

    # Configuration
    endpoint = 'https://tosvectors-cn-beijing.volces.com'
    region = 'cn-beijing'
    bucket_name = 'my-vectors'
    index_name = 'embeddings-768d'

    # Initialize client
    print("Initializing TOS Vectors client...")
    client = tos.VectorClient(ak, sk, endpoint, region)

    # Create bucket
    print(f"Creating vector bucket: {bucket_name}")
    try:
        client.create_vector_bucket(bucket_name)
        print(f"✓ Created bucket: {bucket_name}")
    except tos.exceptions.TosServerError as e:
        if e.code == 'ConflictException':
            print(f"✓ Bucket already exists: {bucket_name}")
        else:
            print(f"✗ Error creating bucket: {e.message}")
            sys.exit(1)

    # Create index
    print(f"Creating vector index: {index_name}")
    try:
        client.create_index(
            account_id=account_id,
            vector_bucket_name=bucket_name,
            index_name=index_name,
            data_type=tos.DataType.DataTypeFloat32,
            dimension=768,
            distance_metric=tos.DistanceMetricType.DistanceMetricCosine
        )
        print(f"✓ Created index: {index_name}")
    except tos.exceptions.TosServerError as e:
        if e.code == 'ConflictException':
            print(f"✓ Index already exists: {index_name}")
        else:
            print(f"✗ Error creating index: {e.message}")
            sys.exit(1)

    print("\n✓ Setup complete!")
    print(f"  Bucket: {bucket_name}")
    print(f"  Index: {index_name}")
    print(f"  Dimension: 768")
    print(f"  Metric: cosine")


if __name__ == '__main__':
    main()
