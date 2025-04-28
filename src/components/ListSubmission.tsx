import { useState, useEffect } from 'react';
import { Card, List, Avatar, Typography } from 'antd';
import { mqttClient } from '@/utils/mqtt';
import { getDrawingsBySlideId } from '@/api';

const { Text } = Typography;

interface Drawing {
  id: string;
  audienceId: string;
  audienceName?: string;
  image: string;
  createdAt: string;
}

interface ListSubmissionProps {
  slideId: string;
}

export const ListSubmission: React.FC<ListSubmissionProps> = ({ slideId }) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial drawings
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        const data = await getDrawingsBySlideId(slideId);
        if (data) {
          setDrawings(data);
        }
      } catch (error) {
        console.error('Error fetching drawings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrawings();
  }, [slideId]);

  // Subscribe to MQTT updates
  useEffect(() => {
    const topic = `presenter/slide/${slideId}/submission`;

    mqttClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'submission' && data.image && data.audienceId) {
          setDrawings(prev => {
            const filtered = prev.filter(drawing => drawing.audienceId !== data.audienceId);
            return [...filtered, {
              id: data.id || Date.now().toString(),
              audienceId: data.audienceId,
              audienceName: data.audienceName,
              image: data.image,
              createdAt: new Date().toISOString()
            }];
          });
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    return () => {
      mqttClient.disconnect();
    };
  }, [slideId]);

  return (
    <Card title="Submissions" loading={loading}>
      <List
        itemLayout="horizontal"
        dataSource={drawings}
        renderItem={(drawing) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={drawing.image} />}
              title={drawing.audienceName || `User ${drawing.audienceId}`}
              description={
                <div>
                  <Text>Submitted at: {new Date(drawing.createdAt).toLocaleString()}</Text>
                  <div className="mt-2">
                    <img 
                      src={drawing.image} 
                      alt={`Drawing by ${drawing.audienceName || drawing.audienceId}`}
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}; 