---
name: creatordb-youtube-v3
description: Can search and get YouTuber information
homepage: https://www.creatordb.app
metadata: {"moltbot":{"emoji":"🐽","requires":{"bins":["curl"],"env":["CREATORDB_API_KEY"]},"primaryEnv":"CREATORDB_API_KEY","install":[]}}
---

# CreatorDB YouTube API

Search and retrieve YouTuber information including subscribers, growth stats, pricing estimates, and more.

## Search YouTubers by Name

```bash
curl --request POST \
  --url https://apiv3.creatordb.app/youtube/search \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "api-key: $CREATORDB_API_KEY" \
  --data '{
  "filters": [
    {
      "filterName": "displayName",
      "op": "=",
      "value": "MrBeast",
      "isFuzzySearch": true
    }
  ],
  "desc": true,
  "sortBy": "totalSubscribers",
  "pageSize": 5,
  "offset": 0
}'
```

Search Response:
```json
{
  "data": {
    "creatorList": [
      {
        "displayName": "YouTube",
        "uniqueId": "@youtube",
        "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
        "avatarUrl": "https://yt3.googleusercontent.com/7cF22TRiceqQr2Cro_X4uhRVnwCdOa2HXiwdBGPnUEqJDuCyr2CykDfDw2rCWjbjaHEdTMUC=s900-c-k-c0x00ffffff-no-rj",
        "totalSubscribers": 13900000
      }
    ],
    "hasNextPage": true,
    "nextOffset": 100
  },
  "quotaUsed": 1,
  "quotaUsedTotal": 241,
  "remainingQuota": 99759,
  "traceId": "f8e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0",
  "timestamp": 1750732453635,
  "errorCode": "",
  "errorDescription": "",
  "success": true
}
```

## Get YouTuber Profile

```bash
curl --request GET \
  --url 'https://apiv3.creatordb.app/youtube/profile?channelId=UCBR8-60-B28hp2BmDPdntcQ' \
  --header 'Accept: application/json' \
  --header "api-key: $CREATORDB_API_KEY"
```

Profile Response:
```json
{
  "data": {
    "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
    "uniqueId": "@youtube",
    "displayName": "YouTube",
    "categoryBreakdown": [
      {
        "category": "Gaming",
        "share": 0.3241
      }
    ],
    "avatarUrl": "https://yt3.googleusercontent.com/7cF22TRiceqQr2Cro_X4uhRVnwCdOa2HXiwdBGPnUEqJDuCyr2CykDfDw2rCWjbjaHEdTMUC=s900-c-k-c0x00ffffff-no-rj",
    "bio": "The Most Botted Channel EVER",
    "isVerified": true,
    "hasSponsors": true,
    "hasMemberOnlyContents": true,
    "country": "TWN",
    "mainLanguage": "zht",
    "languages": [
      "zht",
      "eng"
    ],
    "secondLanguage": "eng",
    "totalContents": 399,
    "totalSubscribers": 13900000,
    "subscriberGrowth": {
      "g7": 0.1234,
      "g30": 0.2345,
      "g90": 0.3456
    },
    "hashtags": [
      {
        "name": "#starrailsimulator",
        "contentCount": 250
      }
    ],
    "topics": [
      "freegames_Gaming"
    ],
    "niches": [
      "roblox_Gaming"
    ],
    "otherLinks": [
      {
        "title": "Instagram",
        "url": "https://www.instagram.com/instagram"
      }
    ],
    "lastPublishTime": 1755142212000,
    "relatedCreators": [
      "UCBR8-60-B28hp2BmDPdntcQ",
      "UC4PooiX37Pld1T8J5SYT-SQ"
    ],
    "videoPrice": {
      "cpmLow": 5.5,
      "cpmRaw": 8.2,
      "cpmHigh": 12,
      "priceLow": 1000,
      "priceRaw": 1500,
      "priceHigh": 2200
    },
    "shortsPrice": {
      "cpmLow": 3,
      "cpmRaw": 5,
      "cpmHigh": 8,
      "priceLow": 500,
      "priceRaw": 750,
      "priceHigh": 1100
    },
    "lastDbUpdateTime": 1753179002000
  },
  "quotaUsed": 1,
  "quotaUsedTotal": 241,
  "remainingQuota": 99759,
  "traceId": "f8e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0",
  "timestamp": 1750732453635,
  "errorCode": "",
  "errorDescription": "",
  "success": true
}
```

## Get YouTuber performance

```bash
curl --request GET \
  --url 'https://apiv3.creatordb.app/youtube/performance?channelId=UCBR8-60-B28hp2BmDPdntcQ' \
  --header 'Accept: application/json' \
  --header 'api-key: $CREATORDB_API_KEY'
```

Response
```json
{
  "data": {
    "contentCountByDays": {
      "7d": 1,
      "30d": 2,
      "90d": 2
    },
    "ranking": {
      "totalSubscribers": {
        "global": 0.9912,
        "country": 0.9986,
        "language": 0.9764
      },
      "avgEngagementRate": {
        "global": 0.9912,
        "country": 0.9986,
        "language": 0.9764
      }
    },
    "videosPerformanceRecent": {
      "likes": {
        "all": 2944445,
        "avg": 100,
        "median": 48,
        "min": 20,
        "max": 149
      },
      "comments": {
        "all": 2944445,
        "avg": 100,
        "median": 48,
        "min": 20,
        "max": 149
      },
      "views": {
        "all": 3599,
        "avg": 100,
        "median": 48,
        "min": 20,
        "max": 149,
        "percentile25": 35,
        "percentile75": 85,
        "iqr": 50
      },
      "length": {
        "avg": 180
      },
      "engagement": {
        "avgEngagementRate": 0.5201,
        "likesPerSubscriber": 0.1111,
        "commentsPerSubscriber": 0.1111,
        "viewsPerSubscriber": 0.1111,
        "engagementConsistency": {
          "cv": 0.1001,
          "medianVsMean": 0.9001,
          "topBottomRatio": 1.2001,
          "consistencyScore": 63,
          "consistencyLevel": "high"
        }
      }
    },
    "shortsPerformanceRecent": {
      "likes": {
        "all": 2459,
        "avg": 100,
        "median": 120,
        "min": 50,
        "max": 988
      },
      "comments": {
        "all": 2459,
        "avg": 100,
        "median": 120,
        "min": 50,
        "max": 988
      },
      "views": {
        "all": 2459,
        "avg": 100,
        "median": 120,
        "min": 50,
        "max": 988,
        "percentile25": 80,
        "percentile75": 250,
        "iqr": 170
      },
      "length": {
        "avg": 180
      },
      "engagement": {
        "avgEngagementRate": 0.5201,
        "likesPerSubscriber": 0.1111,
        "commentsPerSubscriber": 0.1111,
        "viewsPerSubscriber": 0.1111,
        "engagementConsistency": {
          "cv": 0.1001,
          "medianVsMean": 0.9001,
          "topBottomRatio": 1.2001,
          "consistencyScore": 63,
          "consistencyLevel": "high"
        }
      }
    },
    "videosPerformanceAll": {
      "likes": {
        "all": 2944445,
        "avg": 100,
        "median": 48,
        "min": 20,
        "max": 149
      },
      "comments": {
        "all": 2944445,
        "avg": 100,
        "median": 48,
        "min": 20,
        "max": 149
      },
      "views": {
        "all": 3599,
        "avg": 100,
        "median": 48,
        "min": 20,
        "max": 149,
        "percentile25": 35,
        "percentile75": 85,
        "iqr": 50
      },
      "length": {
        "avg": 180
      },
      "engagement": {
        "avgEngagementRate": 0.5201,
        "likesPerSubscriber": 0.1111,
        "commentsPerSubscriber": 0.1111,
        "viewsPerSubscriber": 0.1111,
        "engagementConsistency": {
          "cv": 0.1001,
          "medianVsMean": 0.9001,
          "topBottomRatio": 1.2001,
          "consistencyScore": 63,
          "consistencyLevel": "high"
        }
      }
    },
    "shortsPerformanceAll": {
      "likes": {
        "all": 2459,
        "avg": 100,
        "median": 120,
        "min": 50,
        "max": 988
      },
      "comments": {
        "all": 2459,
        "avg": 100,
        "median": 120,
        "min": 50,
        "max": 988
      },
      "views": {
        "all": 2459,
        "avg": 100,
        "median": 120,
        "min": 50,
        "max": 988,
        "percentile25": 80,
        "percentile75": 250,
        "iqr": 170
      },
      "length": {
        "avg": 180
      },
      "engagement": {
        "avgEngagementRate": 0.5201,
        "likesPerSubscriber": 0.1111,
        "commentsPerSubscriber": 0.1111,
        "viewsPerSubscriber": 0.1111,
        "engagementConsistency": {
          "cv": 0.1001,
          "medianVsMean": 0.9001,
          "topBottomRatio": 1.2001,
          "consistencyScore": 63,
          "consistencyLevel": "high"
        }
      }
    },
    "recentVideosGrowth": {
      "g7": {
        "avgViews": 0.2345,
        "engagementRate": 0.0567
      },
      "g30": {
        "avgViews": 0.2345,
        "engagementRate": 0.0567
      },
      "g90": {
        "avgViews": 0.2345,
        "engagementRate": 0.0567
      }
    },
    "recentShortsGrowth": {
      "g7": {
        "avgViews": 0.2345,
        "engagementRate": 0.0567
      },
      "g30": {
        "avgViews": 0.2345,
        "engagementRate": 0.0567
      },
      "g90": {
        "avgViews": 0.2345,
        "engagementRate": 0.0567
      }
    }
  },
  "quotaUsed": 1,
  "quotaUsedTotal": 241,
  "remainingQuota": 99759,
  "traceId": "f8e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0",
  "timestamp": 1750732453635,
  "errorCode": "",
  "errorDescription": "",
  "success": true
}
```

## Get YouTuber content detail

```base
curl --request GET \
  --url 'https://apiv3.creatordb.app/youtube/content-detail?channelId=UCBR8-60-B28hp2BmDPdntcQ' \
  --header 'Accept: application/json' \
  --header 'api-key: $CREATORDB_API_KEY'
```

Response

```json
{
  "data": {
    "recentVideos": [
      {
        "publishTime": 1755273600000,
        "contentId": "FbCF_H4ZD64",
        "title": "I hosted an ADMIN ABUSE on GROW A GARDEN",
        "description": "Thanks @JandelTheGuy play grow a garden here support a small developer like Jandel. Today I hosted an admin abuse to 20 million people",
        "length": 873,
        "isSponsored": true,
        "isMemberOnly": false,
        "likes": 153000,
        "comments": 15182,
        "views": 5009695,
        "engagementRate": 0.0336,
        "hashtags": [
          "#VLOG"
        ]
      }
    ],
    "recentShorts": [
      {
        "publishTime": 1754928000000,
        "contentId": "6tlVsknqy9M",
        "title": "Customized skin care clinics available in Japan #cosmeticmedicine",
        "description": "Recommended for those looking for skin care in Tokyo. Shimokitazawa Cosmetic Dermatology Clinic @oneup_clinic",
        "length": 60,
        "likes": 10000,
        "comments": 100,
        "views": 15000,
        "engagementRate": 0.0517,
        "hashtags": [
          "#cosmeticmedicine"
        ]
      }
    ]
  },
  "quotaUsed": 1,
  "quotaUsedTotal": 241,
  "remainingQuota": 99759,
  "traceId": "f8e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0",
  "timestamp": 1750732453635,
  "errorCode": "",
  "errorDescription": "",
  "success": true
}
```


## Get YouTuber Sponsorship information

```bash
curl --request GET \
  --url 'https://apiv3.creatordb.app/youtube/sponsorship?channelId=UCBR8-60-B28hp2BmDPdntcQ' \
  --header 'Accept: application/json' \
  --header 'api-key: $CREATORDB_API_KEY'
```

Response
```json
{
  "data": {
    "sponsorList": [
      {
        "brandName": "Acer",
        "brandId": "acer.com",
        "brandIgIds": [
          "acer"
        ],
        "sponsoredVideos": [
          {
            "publishTime": 1754797869000,
            "contentId": "eHnzGYHEdO0",
            "title": "ROBLOX OP ADMIN IN STEAL A BRAINROT",
            "description": "Roblox admin in steal a brainrot except way more OP. i gave almost everyone their stuff back its just fun to make these kids laugh in voice chat lol",
            "length": 873,
            "isSponsored": true,
            "isMemberOnly": false,
            "likes": 10000,
            "comments": 100,
            "views": 15000,
            "engagementRate": 0.1202,
            "hashtags": [
              "#VLOG"
            ]
          }
        ],
        "sponsoredVideosPerformance": {
          "likes": {
            "all": 2944445,
            "avg": 100,
            "median": 48,
            "min": 20,
            "max": 149
          },
          "comments": {
            "all": 2944445,
            "avg": 100,
            "median": 48,
            "min": 20,
            "max": 149
          },
          "views": {
            "all": 3599,
            "avg": 100,
            "median": 48,
            "min": 20,
            "max": 149,
            "percentile25": 35,
            "percentile75": 85,
            "iqr": 50
          },
          "length": {
            "avg": 180
          },
          "engagement": {
            "avgEngagementRate": 0.5201,
            "likesPerSubscriber": 0.1111,
            "commentsPerSubscriber": 0.1111,
            "viewsPerSubscriber": 0.1111,
            "engagementConsistency": {
              "cv": 0.1001,
              "medianVsMean": 0.9001,
              "topBottomRatio": 1.2001,
              "consistencyScore": 63,
              "consistencyLevel": "high"
            }
          }
        }
      }
    ]
  },
  "quotaUsed": 1,
  "quotaUsedTotal": 241,
  "remainingQuota": 99759,
  "traceId": "f8e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0",
  "timestamp": 1750732453635,
  "errorCode": "",
  "errorDescription": "",
  "success": true
}
```

## Get YouTuber audience demographics

```bash
curl --request GET \
  --url 'https://apiv3.creatordb.app/youtube/audience?channelId=UCBR8-60-B28hp2BmDPdntcQ' \
  --header 'Accept: application/json' \
  --header 'api-key: $CREATORDB_API_KEY'
```

Response
```json
{
  "data": {
    "audienceLocations": [
      {
        "country": "USA",
        "share": 0.5511
      },
      {
        "country": "GBR",
        "share": 0.1313
      },
      {
        "country": "CAN",
        "share": 0.0501
      }
    ],
    "audienceGender": {
      "maleRatio": 0.5233,
      "femaleRatio": 0.4412
    },
    "audienceAvgAge": 30,
    "audienceAgeBreakdown": [
      {
        "ageRange": "13-17",
        "share": 0.0123
      },
      {
        "ageRange": "18-24",
        "share": 0.1871
      },
      {
        "ageRange": "25-34",
        "share": 0.2818
      },
      {
        "ageRange": "35-44",
        "share": 0.2025
      },
      {
        "ageRange": "45-54",
        "share": 0.1398
      },
      {
        "ageRange": "55-64",
        "share": 0.1
      },
      {
        "ageRange": "65+",
        "share": 0.0765
      }
    ]
  },
  "quotaUsed": 1,
  "quotaUsedTotal": 241,
  "remainingQuota": 99759,
  "traceId": "f8e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0",
  "timestamp": 1750732453635,
  "errorCode": "",
  "errorDescription": "",
  "success": true
}
```

## API Key

- `CREATORDB_API_KEY` env var is required
- Or set `skills."creatordb-youtube-v3".env.CREATORDB_API_KEY` in `~/.clawdbot/moltbot.json`
- Get your API key at https://www.creatordb.app

## Notes

- Use `channelId` from search results to get detailed profile
- `subscriberGrowth`: `g7`/`g30`/`g90` = growth rate over 7/30/90 days
- `videoPrice`/`shortsPrice`: estimated sponsorship pricing in USD
- `categoryBreakdown`: channel content category distribution
- Pagination: use `offset` and `pageSize` for search results
