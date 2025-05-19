package com.consultandwin.project.service;


import com.consultandwin.project.models.OrderEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void sendOrderEvent(OrderEvent event) throws JsonProcessingException {
        String message = objectMapper.writeValueAsString(event);
        kafkaTemplate.send("order-events", event.getOrderId(), message);
    }
}
