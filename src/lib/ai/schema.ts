export const generationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["analysis", "instagramCards", "instagramEngine", "blog", "suggestedTags", "creative"],
  properties: {
    analysis: {
      type: "object",
      additionalProperties: false,
      required: [
        "keyClaims",
        "biomechanicsPrinciples",
        "clinicalInterpretation",
        "easyExplanation",
        "practicalApplication",
        "exerciseIdeas",
        "precautions",
      ],
      properties: {
        keyClaims: { type: "array", minItems: 1, items: { type: "string" } },
        biomechanicsPrinciples: {
          type: "array",
          minItems: 1,
          items: { type: "string" },
        },
        clinicalInterpretation: { type: "string" },
        easyExplanation: { type: "string" },
        practicalApplication: {
          type: "array",
          minItems: 1,
          items: { type: "string" },
        },
        exerciseIdeas: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "purpose", "instructions", "bodyPart"],
            properties: {
              name: { type: "string" },
              purpose: { type: "string" },
              instructions: { type: "string" },
              bodyPart: { type: "string" },
            },
          },
        },
        precautions: { type: "array", minItems: 1, items: { type: "string" } },
      },
    },
    instagramCards: {
      type: "array",
      minItems: 5,
      maxItems: 9,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "slide",
          "headline",
          "subheadline",
          "body",
          "callout",
          "imageDescription",
          "source",
          "categoryBadge",
          "summaryText",
          "purpose",
          "visualType",
          "swipeFlow",
          "textDensity",
          "locks",
        ],
        properties: {
          slide: { type: "integer", minimum: 1, maximum: 9 },
          headline: { type: "string" },
          subheadline: { type: "string" },
          body: { type: "string" },
          callout: { type: "string" },
          imageDescription: { type: "string" },
          source: { type: "string" },
          categoryBadge: { type: "string" },
          summaryText: { type: "string" },
          purpose: { type: "string", enum: ["HOOK", "RELATABLE_PROBLEM", "KEY_PRINCIPLE", "EASY_EXPLANATION", "VISUAL_EXPLANATION", "APPLICATION", "MISTAKE", "TAKEAWAY", "SOURCE_CTA"] },
          visualType: { type: "string", enum: ["COVER", "ILLUSTRATION", "MEDICAL_DIAGRAM", "MOVEMENT_DIAGRAM", "COMPARISON", "HUMOR", "BODY_CHARACTER", "EXERCISE", "CHECKLIST", "TEXT_ONLY", "SUMMARY", "SOURCE"] },
          swipeFlow: {
            type: "object", additionalProperties: false,
            required: ["currentMessage", "curiosityGap", "nextCardReason", "transitionLine"],
            properties: { currentMessage: { type: "string" }, curiosityGap: { type: "string" }, nextCardReason: { type: "string" }, transitionLine: { type: "string" } },
          },
          textDensity: { type: "string", enum: ["LOW", "GOOD", "HIGH", "TOO_HIGH"] },
          locks: {
            type: "object", additionalProperties: false, required: ["headline", "image", "card"],
            properties: { headline: { type: "boolean" }, image: { type: "boolean" }, card: { type: "boolean" } },
          },
        },
      },
    },
    instagramEngine: {
      type: "object", additionalProperties: false,
      required: ["selectedAngleType", "selectedHookText", "personality", "targetAudience", "cardCount", "storyboard", "caption", "hashtags", "cta", "saveValue", "shareValue", "sourceNotice", "quality"],
      properties: {
        selectedAngleType: { type: "string", enum: ["PAIN", "COMMON_MISTAKE", "SURPRISING_FACT", "MOVEMENT", "DAILY_LIFE", "MYTH", "CHECKLIST", "BEGINNER", "EXERCISE", "PATIENT_EDUCATION"] },
        selectedHookText: { type: "string" },
        personality: { type: "string", enum: ["STANDARD", "FRIENDLY", "PROFESSIONAL", "PLAYFUL", "SERIOUS", "STORYTELLING", "MYTH_BUSTING"] },
        targetAudience: { type: "string" },
        cardCount: { type: "integer", minimum: 5, maximum: 9 },
        storyboard: {
          type: "array", minItems: 5, maxItems: 9,
          items: {
            type: "object", additionalProperties: false,
            required: ["cardNumber", "purpose", "headline", "visualType", "visualDescription", "layout", "emotion", "transition", "imageNeeded"],
            properties: {
              cardNumber: { type: "integer", minimum: 1, maximum: 9 },
              purpose: { type: "string", enum: ["HOOK", "RELATABLE_PROBLEM", "KEY_PRINCIPLE", "EASY_EXPLANATION", "VISUAL_EXPLANATION", "APPLICATION", "MISTAKE", "TAKEAWAY", "SOURCE_CTA"] },
              headline: { type: "string" },
              visualType: { type: "string", enum: ["COVER", "ILLUSTRATION", "MEDICAL_DIAGRAM", "MOVEMENT_DIAGRAM", "COMPARISON", "HUMOR", "BODY_CHARACTER", "EXERCISE", "CHECKLIST", "TEXT_ONLY", "SUMMARY", "SOURCE"] },
              visualDescription: { type: "string" }, layout: { type: "string" }, emotion: { type: "string" }, transition: { type: "string" }, imageNeeded: { type: "boolean" },
            },
          },
        },
        caption: {
          type: "object", additionalProperties: false,
          required: ["hook", "context", "additionalValue", "shortExplanation", "takeaway", "source", "cta", "primaryTopic", "secondaryTopics", "audienceTerms", "fullText"],
          properties: {
            hook: { type: "string" }, context: { type: "string" }, additionalValue: { type: "string" }, shortExplanation: { type: "string" }, takeaway: { type: "string" }, source: { type: "string" }, cta: { type: "string" }, primaryTopic: { type: "string" }, secondaryTopics: { type: "array", items: { type: "string" } }, audienceTerms: { type: "array", items: { type: "string" } }, fullText: { type: "string" },
          },
        },
        hashtags: { "$ref": "#/$defs/hashtagGroups" },
        cta: { type: "object", additionalProperties: false, required: ["type", "text"], properties: { type: { type: "string", enum: ["SAVE", "SHARE", "COMMENT", "FOLLOW", "NEXT_CONTENT", "SELF_CHECK"] }, text: { type: "string" } } },
        saveValue: { type: "string" }, shareValue: { type: "string" }, sourceNotice: { type: "string" },
        quality: { "$ref": "#/$defs/instagramQuality" },
      },
    },
    blog: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "hook",
        "whoThisIsFor",
        "problemExplanation",
        "expertConcept",
        "easyExplanation",
        "clinicalInterpretation",
        "applications",
        "precautions",
        "summary",
        "sourceText",
        "relatedContentCta",
        "naverSeo",
        "markdown",
      ],
      properties: {
        title: { type: "string" },
        hook: { type: "string" },
        whoThisIsFor: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
        problemExplanation: { type: "string" },
        expertConcept: { type: "string" },
        easyExplanation: { type: "string" },
        clinicalInterpretation: { type: "string" },
        applications: { type: "array", minItems: 1, items: { type: "string" } },
        precautions: { type: "array", minItems: 1, items: { type: "string" } },
        summary: { type: "string" },
        sourceText: { type: "string" },
        relatedContentCta: { type: "string" },
        naverSeo: {
          type: "object",
          additionalProperties: false,
          required: [
            "primaryTopic", "searchIntents", "primaryKeyword", "secondaryKeywords",
            "relatedConcepts", "titleCandidates", "recommendedTitle", "imagePlan",
            "tags", "topicCluster", "relatedContentTitles", "originalityChecks",
            "keywordWarnings", "brandChecks", "readiness", "seoScore"
          ],
          properties: {
            primaryTopic: { type: "string" },
            searchIntents: { type: "array", minItems: 1, items: { type: "string" } },
            primaryKeyword: { type: "string" },
            secondaryKeywords: { type: "array", minItems: 3, maxItems: 7, items: { type: "string" } },
            relatedConcepts: { type: "array", minItems: 2, items: { type: "string" } },
            titleCandidates: {
              type: "array", minItems: 5, maxItems: 5,
              items: {
                type: "object", additionalProperties: false, required: ["type", "title"],
                properties: {
                  type: { type: "string", enum: ["search", "curiosity", "contrarian", "empathy", "expert_easy"] },
                  title: { type: "string" }
                }
              }
            },
            recommendedTitle: { type: "string" },
            imagePlan: {
              type: "array", minItems: 1, maxItems: 5,
              items: {
                type: "object", additionalProperties: false,
                required: ["position", "role", "brief", "caption"],
                properties: {
                  position: { type: "string" }, role: { type: "string" },
                  brief: { type: "string" }, caption: { type: "string" }
                }
              }
            },
            tags: {
              type: "object", additionalProperties: false, required: ["brand", "topic", "audience", "search"],
              properties: {
                brand: { type: "array", items: { type: "string" } },
                topic: { type: "array", items: { type: "string" } },
                audience: { type: "array", items: { type: "string" } },
                search: { type: "array", items: { type: "string" } }
              }
            },
            topicCluster: {
              type: "object", additionalProperties: false, required: ["name", "relatedTopics"],
              properties: { name: { type: "string" }, relatedTopics: { type: "array", items: { type: "string" } } }
            },
            relatedContentTitles: { type: "array", items: { type: "string" } },
            originalityChecks: { type: "array", minItems: 6, items: { "$ref": "#/$defs/qualityCheck" } },
            keywordWarnings: { type: "array", items: { type: "string" } },
            brandChecks: { type: "array", minItems: 5, items: { "$ref": "#/$defs/qualityCheck" } },
            readiness: { type: "string", enum: ["ready", "needs_revision"] },
            seoScore: {
              type: "object", additionalProperties: false,
              required: ["searchIntent", "titleQuality", "originality", "expertiseInterpretation", "readability", "structure", "imageUsefulness", "sourceTransparency", "brandConsistency", "relatedContent", "total"],
              properties: {
                searchIntent: { type: "integer", minimum: 0, maximum: 20 },
                titleQuality: { type: "integer", minimum: 0, maximum: 10 },
                originality: { type: "integer", minimum: 0, maximum: 15 },
                expertiseInterpretation: { type: "integer", minimum: 0, maximum: 15 },
                readability: { type: "integer", minimum: 0, maximum: 10 },
                structure: { type: "integer", minimum: 0, maximum: 10 },
                imageUsefulness: { type: "integer", minimum: 0, maximum: 5 },
                sourceTransparency: { type: "integer", minimum: 0, maximum: 5 },
                brandConsistency: { type: "integer", minimum: 0, maximum: 5 },
                relatedContent: { type: "integer", minimum: 0, maximum: 5 },
                total: { type: "integer", minimum: 0, maximum: 100 }
              }
            }
          }
        },
        markdown: { type: "string" },
      },
    },
    suggestedTags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category"],
        properties: {
          name: { type: "string" },
          category: {
            type: "string",
            enum: ["topic", "body_part", "exercise", "symptom", "biomechanics"],
          },
        },
      },
    },
    creative: {
      type: "object",
      additionalProperties: false,
      required: [
        "hooks",
        "contentAngles",
        "metaphors",
        "empathyLines",
        "humorLines",
        "imageBriefs",
        "hashtags",
      ],
      properties: {
        hooks: {
          type: "array",
          minItems: 10,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "text", "score", "clickbaitRisk", "scoreBreakdown"],
            properties: {
              type: {
                type: "string",
                enum: ["CURIOSITY", "EMPATHY", "CONTRARIAN", "PAIN", "MISTAKE", "QUESTION", "CHECKLIST", "SURPRISE", "MYTH", "STORY"],
              },
              text: { type: "string" },
              score: { type: "integer", minimum: 0, maximum: 100 },
              clickbaitRisk: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
              scoreBreakdown: {
                type: "object", additionalProperties: false,
                required: ["stopPower", "curiosity", "audienceRelevance", "clarity", "specificity", "brandFit"],
                properties: { stopPower: { type: "integer", minimum: 0, maximum: 25 }, curiosity: { type: "integer", minimum: 0, maximum: 20 }, audienceRelevance: { type: "integer", minimum: 0, maximum: 20 }, clarity: { type: "integer", minimum: 0, maximum: 15 }, specificity: { type: "integer", minimum: 0, maximum: 10 }, brandFit: { type: "integer", minimum: 0, maximum: 10 } },
              },
            },
          },
        },
        contentAngles: {
          type: "array",
          minItems: 6,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "description", "targetAudience", "whyItWorks", "expectedHookStrength", "saveValue", "shareValue", "recommendedCardCount"],
            properties: {
              type: {
                type: "string",
                enum: [
                  "PAIN", "COMMON_MISTAKE", "SURPRISING_FACT", "MOVEMENT", "DAILY_LIFE",
                  "MYTH", "CHECKLIST", "BEGINNER", "EXERCISE", "PATIENT_EDUCATION",
                ],
              },
              title: { type: "string" },
              description: { type: "string" },
              targetAudience: { type: "string" }, whyItWorks: { type: "string" },
              expectedHookStrength: { type: "integer", minimum: 0, maximum: 100 },
              saveValue: { type: "integer", minimum: 0, maximum: 100 }, shareValue: { type: "integer", minimum: 0, maximum: 100 },
              recommendedCardCount: { type: "integer", minimum: 5, maximum: 9 },
            },
          },
        },
        metaphors: { type: "array", minItems: 2, items: { type: "string" } },
        empathyLines: { type: "array", minItems: 2, items: { type: "string" } },
        humorLines: { type: "array", minItems: 2, items: { type: "string" } },
        imageBriefs: {
          type: "array",
          minItems: 5,
          maxItems: 9,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["slide", "role", "description"],
            properties: {
              slide: { type: "integer", minimum: 1, maximum: 9 },
              role: {
                type: "string",
                enum: [
                  "hook_image",
                  "explanatory_diagram",
                  "humorous_concept_illustration",
                  "comparison_visual",
                  "summary_visual",
                ],
              },
              description: { type: "string" },
            },
          },
        },
        hashtags: {
          type: "object",
          additionalProperties: false,
          required: ["brand", "topic", "audience", "search"],
          properties: {
            brand: { type: "array", items: { type: "string" } },
            topic: { type: "array", items: { type: "string" } },
            audience: { type: "array", items: { type: "string" } },
            search: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
  $defs: {
    hashtagGroups: {
      type: "object", additionalProperties: false, required: ["brand", "topic", "audience", "search", "niche"],
      properties: { brand: { type: "array", items: { type: "string" } }, topic: { type: "array", items: { type: "string" } }, audience: { type: "array", items: { type: "string" } }, search: { type: "array", items: { type: "string" } }, niche: { type: "array", items: { type: "string" } } },
    },
    instagramQuality: {
      type: "object", additionalProperties: false, required: ["total", "scores", "warnings", "ready"],
      properties: {
        total: { type: "integer", minimum: 0, maximum: 100 }, ready: { type: "boolean" },
        scores: { type: "object", additionalProperties: false, required: ["hook", "swipe", "clarity", "save", "share", "visual", "textDensity", "brand", "caption", "source"], properties: { hook: { type: "integer", minimum: 0, maximum: 100 }, swipe: { type: "integer", minimum: 0, maximum: 100 }, clarity: { type: "integer", minimum: 0, maximum: 100 }, save: { type: "integer", minimum: 0, maximum: 100 }, share: { type: "integer", minimum: 0, maximum: 100 }, visual: { type: "integer", minimum: 0, maximum: 100 }, textDensity: { type: "integer", minimum: 0, maximum: 100 }, brand: { type: "integer", minimum: 0, maximum: 100 }, caption: { type: "integer", minimum: 0, maximum: 100 }, source: { type: "integer", minimum: 0, maximum: 100 } } },
        warnings: { type: "array", items: { type: "object", additionalProperties: false, required: ["card", "message", "severity"], properties: { card: { type: ["integer", "null"] }, message: { type: "string" }, severity: { type: "string", enum: ["info", "warning", "error"] } } } },
      },
    },
    qualityCheck: {
      type: "object",
      additionalProperties: false,
      required: ["label", "passed", "note"],
      properties: {
        label: { type: "string" },
        passed: { type: "boolean" },
        note: { type: "string" },
      },
    },
  },
} as const;
