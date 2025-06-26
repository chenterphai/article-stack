import config from '@/config';
import { Client } from '@elastic/elasticsearch'

const esClient = new Client({
    node: config.ELASTICSEARCH_URL,
    auth: {
        apiKey: config.ELASTICSEARCH_API_KEY
    }
});

export default esClient