import { Article } from '@/entities/article.entities';
import { logger } from '@/libs/winston';
import { Client } from '@elastic/elasticsearch';

export class ArticleElastic {
  private esClient: Client;

  ARTICLE_INDEX = 'article-index';

  constructor(esClient: Client) {
    this.esClient = esClient;
    this.createArticleIndex();
  }

  private async createArticleIndex() {
    try {
      // Check if the index already exists
      const exists = await this.esClient.indices.exists({
        index: this.ARTICLE_INDEX,
      });

      // If the index does not exist, create it with defined mappings
      if (!exists) {
        await this.esClient.indices.create({
          index: this.ARTICLE_INDEX,
          settings: {
            index: {
              number_of_replicas: 2,
              number_of_shards: 3,
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' }, // 'keyword' for exact ID matching,
              title: { type: 'text' }, // For full-text search
              content: { type: 'text' },
              authorId: { type: 'keyword' }, // Store author ID for filtering or reference
              slug: { type: 'keyword' },
              creationtime: { type: 'date' }, // 'date' for date range queries and sorting
            },
          },
        });
        logger.info(
          `Elasticsearch index '${this.ARTICLE_INDEX}' created successfully.`,
        );
      }
    } catch (error) {
      logger.error(
        `Error creating Elasticsearch index '${this.ARTICLE_INDEX}': ${error}`,
      );
    }
  }

  async indexArticleInElasticsearch(article: Article) {
    try {
      await this.esClient.index({
        index: this.ARTICLE_INDEX,
        id: article.id.toString(),
        document: {
          id: article.id,
          title: article.title,
          content: article.content,
          authorId: article.author.id,
          slug: article.slug,
          creationtime: article.creationtime,
        },
        refresh: 'wait_for',
      });
      logger.info(
        `Article ${article.id} successfully indexed in Elasticsearch.`,
      );
    } catch (error) {
      logger.error(
        `Error indexing article ${article.id} in Elasticsearch: ${error}`,
      );
    }
  }

  async searchArticleInElasticsearch(
    searchKeyword: string,
    limit: number,
    offset: number,
  ) {
    if (searchKeyword && searchKeyword.trim() !== '') {
      // Construct the Elasticsearch query for multi-field search
      const esResponse = await this.esClient.search({
        index: this.ARTICLE_INDEX,
        from: offset, // Pagination: 'from' is the offset
        size: limit, // Pagination: 'size' is the limit
        query: {
          multi_match: {
            query: searchKeyword,
            fields: ['title^3', 'content'],
            fuzziness: 'AUTO',
          },
        },
        _source: ['id'],
      });
      //   logger.info(esResponse.hits.hits);
      return esResponse.hits.hits.map((hit: any) => parseInt(hit._id, 10));
    } else {
      return null;
    }
  }
}
