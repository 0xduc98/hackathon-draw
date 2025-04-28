'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { mqttClient } from '@/utils/mqtt';
import { Button, Input, Upload, message, Image, List, Card, Space, Typography, Tooltip, Row, Col, Divider } from 'antd';
import { UploadOutlined, DeleteOutlined, ClockCircleOutlined, UserOutlined, PlayCircleOutlined, StopOutlined, EditOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { useSlideStore } from '@/store/slideStore';
import { getDrawingsBySlideId, Drawing } from '@/api';

const { Title, Text } = Typography;

interface MQTTMessage {
  type: 'title_update' | 'reference_image' | 'countdown_start' | 'countdown_update' | 'countdown_end' | 'image';
  title?: string;
  image?: string;
  duration?: number;
  remainingTime?: number;
  audienceId?: string;
  audienceName?: string;
}

interface Submission {
  id: string;
  image: string;
  audienceId: string;
  audienceName: string;
  timestamp: number;
}

export default function EditPage() {
  const searchParams = useSearchParams();
  const activityId = searchParams.get('activityId');
  const [countdownDuration, setCountdownDuration] = useState(60);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [historicalSubmissions, setHistoricalSubmissions] = useState<Drawing[]>([]);
  const { fetchSlideData } = useSlideStore();

  useEffect(() => {
    if (!activityId) {
      message.error('Missing activity ID');
      return;
    }

    // Fetch slide data when page loads
    fetchSlideData(activityId);

    const topic = `presenter/slide/${activityId}`;
    console.log('Subscribing to topic:', topic);
    
    mqttClient.subscribe(topic, (message) => {
      try {
        console.log('Received MQTT message:', message);
        const data = JSON.parse(message) as MQTTMessage;
        console.log('Parsed MQTT data:', data);
        
        if (data.type === 'title_update') {
          const titleInput = document.getElementById('title-input') as HTMLInputElement;
          if (titleInput) {
            titleInput.value = data.title || '';
          }
        } else if (data.type === 'image') {
          console.log('Received image submission:', {
            hasImage: !!data.image,
            imageLength: data.image?.length,
            audienceId: data.audienceId,
            audienceName: data.audienceName
          });
          
          if (data.image && data.audienceId && data.audienceName) {
            const newSubmission: Submission = {
              id: `${data.audienceId}-${Date.now()}`,
              image: data.image,
              audienceId: data.audienceId,
              audienceName: data.audienceName,
              timestamp: Date.now()
            };
            setSubmissions(prev => [newSubmission, ...prev]);
            message.success(`New submission from ${data.audienceName}`);
          } else {
            console.error('Invalid image submission data:', {
              missingImage: !data.image,
              missingAudienceId: !data.audienceId,
              missingAudienceName: !data.audienceName,
              data
            });
          }
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    return () => {
      mqttClient.disconnect();
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [activityId, countdownInterval, fetchSlideData]);

  // Fetch historical submissions
  useEffect(() => {
    if (!activityId) return;

    const fetchHistoricalSubmissions = async () => {
      try {
        const drawings = await getDrawingsBySlideId(activityId);
        setHistoricalSubmissions(drawings);
      } catch (error) {
        console.error('Error fetching historical submissions:', error);
        message.error('Failed to fetch historical submissions');
      }
    };

    fetchHistoricalSubmissions();
  }, [activityId]);

  const publishMessage = useCallback((data: MQTTMessage) => {
    if (!activityId) return;
    mqttClient.publish(`presenter/slide/${activityId}`, JSON.stringify(data));
  }, [activityId]);

  const debouncedTitleUpdate = useCallback(
    debounce((value: string) => {
      publishMessage({
        type: 'title_update',
        title: value
      });
    }, 500),
    [publishMessage]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedTitleUpdate(e.target.value);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      publishMessage({
        type: 'reference_image',
        image: imageData
      });
      message.success('Image uploaded successfully');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const startSession = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    setIsSessionActive(true);
    setSubmissions([]); // Clear previous submissions
    let remainingTime = countdownDuration;

    publishMessage({
      type: 'countdown_start',
      duration: countdownDuration
    });

    const interval = setInterval(() => {
      remainingTime -= 1;
      publishMessage({
        type: 'countdown_update',
        remainingTime
      });

      if (remainingTime <= 0) {
        clearInterval(interval);
        setIsSessionActive(false);
        publishMessage({
          type: 'countdown_end'
        });
      }
    }, 1000);

    setCountdownInterval(interval);
  };

  const endSession = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    setIsSessionActive(false);
    publishMessage({
      type: 'countdown_end'
    });
  };

  const handleDeleteSubmission = (submissionId: string) => {
    setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
    message.success('Submission deleted');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!activityId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Missing activity ID</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Row gutter={[16, 16]}>
          {/* Left Column - Controls */}
          <Col xs={24} lg={8}>
            <Card className="h-full shadow-lg rounded-xl">
              <Title level={3} className="mb-6 flex items-center">
                <EditOutlined className="mr-2" />
                Session Controls
              </Title>
              
              <div className="space-y-6">
                {/* Title Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Title
                  </label>
                  <Input
                    id="title-input"
                    onChange={handleTitleChange}
                    placeholder="Enter session title"
                    className="w-full"
                    size="large"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Image
                  </label>
                  <Upload
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button icon={<UploadOutlined />} size="large" block>
                      Upload Image
                    </Button>
                  </Upload>
                </div>

                {/* Countdown Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Countdown Duration (seconds)
                  </label>
                  <Input
                    type="number"
                    value={countdownDuration}
                    onChange={(e) => setCountdownDuration(Number(e.target.value))}
                    min={1}
                    max={300}
                    className="w-full"
                    size="large"
                  />
                </div>

                <Divider />

                {/* Session Controls */}
                <div className="flex flex-col gap-4">
                  {!isSessionActive ? (
                    <Button
                      type="primary"
                      onClick={startSession}
                      size="large"
                      icon={<PlayCircleOutlined />}
                      className="h-12 text-lg"
                    >
                      Start Session
                    </Button>
                  ) : (
                    <Button
                      danger
                      onClick={endSession}
                      size="large"
                      icon={<StopOutlined />}
                      className="h-12 text-lg"
                    >
                      End Session
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </Col>

          {/* Right Column - Submissions */}
          <Col xs={24} lg={16}>
            <Card className="shadow-lg rounded-xl">
              <Title level={3} className="mb-6">Submissions</Title>
              
              {/* Active Session Submissions */}
              {isSessionActive && submissions.length > 0 && (
                <>
                  <Title level={4} className="mb-4">Current Session</Title>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={submissions}
                    renderItem={(submission) => (
                      <List.Item>
                        <Card
                          hoverable
                          cover={<Image src={submission.image} alt="Submission" />}
                          actions={[
                            <Tooltip title="Delete">
                              <DeleteOutlined onClick={() => handleDeleteSubmission(submission.id)} />
                            </Tooltip>
                          ]}
                        >
                          <Card.Meta
                            title={submission.audienceName}
                            description={
                              <Space direction="vertical" size="small">
                                <Text type="secondary">
                                  <UserOutlined /> {submission.audienceId}
                                </Text>
                                <Text type="secondary">
                                  <ClockCircleOutlined /> {formatTimestamp(submission.timestamp)}
                                </Text>
                              </Space>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                  <Divider />
                </>
              )}

              {/* Historical Submissions */}
              {historicalSubmissions.length > 0 && (
                <>
                  <Title level={4} className="mb-4">Historical Submissions</Title>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={historicalSubmissions}
                    renderItem={(submission) => (
                      <List.Item>
                        <Card
                          hoverable
                          cover={<Image src={submission.image_data} alt="Submission" />}
                        >
                          <Card.Meta
                            title={submission.audience_name}
                            description={
                              <Space direction="vertical" size="small">
                                <Text type="secondary">
                                  <UserOutlined /> {submission.audience_id}
                                </Text>
                                <Text type="secondary">
                                  <ClockCircleOutlined /> {new Date(submission.created_at).toLocaleString()}
                                </Text>
                              </Space>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                </>
              )}

              {/* No Submissions Message */}
              {!isSessionActive && submissions.length === 0 && historicalSubmissions.length === 0 && (
                <div className="text-center py-8">
                  <Text type="secondary">No submissions yet. Start a session to collect submissions.</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
} 