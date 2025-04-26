import React from 'react';
import { Card, Row, Col } from 'antd';

interface AudienceImage {
  audienceId: string;
  audienceName?: string;
  image: string;
}

interface AudienceImageGalleryProps {
  images: AudienceImage[];
}

export const AudienceImageGallery: React.FC<AudienceImageGalleryProps> = ({ images }) => (
  <Row gutter={[16, 16]}>
    {images.map(({ audienceId, audienceName, image }) => (
      <Col xs={24} sm={12} md={8} lg={6} key={audienceId}>
        <Card title={audienceName ? `Audience: ${audienceName}` : audienceId} hoverable>
          <img
            src={image}
            alt={`Drawing from ${audienceId}`}
            style={{ width: '100%', height: 200, objectFit: 'contain', background: '#fafafa' }}
          />
        </Card>
      </Col>
    ))}
  </Row>
); 