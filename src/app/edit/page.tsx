'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout, Card, Button, Typography, message, Upload, Row, Col, Input, Select, Form, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useSlideStore } from '@/store/slideStore';
import { mqttClient } from '@/utils/mqtt';
import { updateSlideSettings } from '@/api';
import debounce from 'lodash/debounce';
import { useQuery } from '@tanstack/react-query';

const { Content } = Layout;
const { Title } = Typography;

interface FormValues {
  title: string;
  countdownDuration: number;
  referenceImage: string | null;
}

const MQTT_TOPIC_PREFIX = 'presenter/slide';

export default function EditPage() {
  const searchParams = useSearchParams();
  const slideId = searchParams.get('slideId');
  const [form] = Form.useForm<FormValues>();
  const { fetchSlideData, title, countdownTime, referenceImage } = useSlideStore();

  const { isLoading } = useQuery({
    queryKey: ['slide', slideId],
    queryFn: () => fetchSlideData(slideId!),
    enabled: !!slideId,
  });

  const getMqttTopic = useCallback(() => {
    if (!slideId) return '';
    return `${MQTT_TOPIC_PREFIX}/${slideId}`;
  }, [slideId]);

  useEffect(() => {
    form.setFieldsValue({
      title: title,
      countdownDuration: countdownTime || undefined,
      referenceImage: referenceImage
    });
  }, [title, countdownTime, referenceImage, form]);

  useEffect(() => {
    if (!slideId) {
      console.error('Missing required parameter: slideId');
      message.error('Missing required parameter: slideId');
      return;
    }

    const topic = getMqttTopic();
    console.log('Subscribing to topic:', topic);

    return () => {
      mqttClient.disconnect();
    };
  }, [slideId, getMqttTopic]);

  const publishMessage = useCallback((data: { type: string; title?: string; image?: string; countdownTime?: number }) => {
    const topic = getMqttTopic();
    if (!topic) return;
    mqttClient.publish(topic, JSON.stringify(data));
  }, [getMqttTopic]);

  const updateSlide = useCallback(async (values: FormValues) => {
    if (!slideId) return;
    try {
      console.log('Updating slide settings:', values);
      await updateSlideSettings({
        slideId,
        title: values.title,
        countdownTime: values.countdownDuration,
      });
    } catch (error) {
      console.error('Error updating slide:', error);
      message.error('Failed to update slide settings');
    }
  }, [slideId]);

  const debouncedUpdateSlide = useCallback(
    debounce((values: FormValues) => {
      updateSlide(values);
    }, 500),
    [updateSlide]
  );

  const handleValuesChange = useCallback((changedValues: Partial<FormValues>, allValues: FormValues) => {
    // Nếu là referenceImage thì KHÔNG update slide ở đây
    if (changedValues.referenceImage !== undefined) {
    
    }

    if (changedValues.title !== undefined) {
      publishMessage({
        type: 'title_update',
        title: allValues.title
      });
    }
    if (changedValues.countdownDuration !== undefined) {
      publishMessage({
        type: 'countdown_update',
        countdownTime: allValues.countdownDuration
      });
    }
    debouncedUpdateSlide(allValues);
  }, [publishMessage, debouncedUpdateSlide]);

  const handleImageUpload = async (file: File) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        form.setFieldValue('referenceImage', base64Image);
        message.success('Image uploaded successfully');
        
        // Update slide settings with the base64 image
        if (slideId) {
          updateSlideSettings({
            slideId,
            title: form.getFieldValue('title'),
            countdownTime: form.getFieldValue('countdownDuration'),
            referenceImage: base64Image
          }).catch(console.error);
          
          // Publish MQTT message
          publishMessage({
            type: 'reference_image',
            reference_image: base64Image
          });
        }
      };
      reader.readAsDataURL(file);
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Failed to upload image');
      return false;
    }
  };

  if (!slideId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Missing slide ID</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Content className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card className="shadow-lg rounded-xl">
                <Title level={3} className="mb-6">Controls</Title>
                <Form
                  form={form}
                  layout="vertical"
                  onValuesChange={handleValuesChange}
                >
                  <Form.Item
                    label={<Title level={5}>Title / Question</Title>}
                    name="title"
                  >
                    <Input
                      placeholder="Enter your question or title..."
                      maxLength={100}
                    />
                  </Form.Item>

                  <Form.Item
                    name="referenceImage"
                  >
                    <Upload
                      beforeUpload={handleImageUpload}
                      showUploadList={false}
                    >
                      <Button icon={<UploadOutlined />}>Upload Image</Button>
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    label={<Title level={5}>Countdown Duration</Title>}
                    name="countdownDuration"
                  >
                    <Select
                      style={{ width: '120px' }}
                      options={[
                        { value: 10, label: '10s' },
                        { value: 20, label: '20s' },
                        { value: 30, label: '30s' },
                        { value: 40, label: '40s' },
                        { value: 50, label: '50s' },
                        { value: 60, label: '60s' },
                      ]}
                    />
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
} 