package com.consultandwin.project.service;


import com.consultandwin.project.models.OrderEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private EmailService emailService;

    @KafkaListener(topics = "order-events", groupId = "notification-group")
    public void consume(ConsumerRecord<String, String> record) throws Exception {
        OrderEvent event = objectMapper.readValue(record.value(), OrderEvent.class);

        String subject = "Order " + event.getOrderId() + " Status Update";
        String body = "Dear customer,\n\nYour order is now " + event.getStatus() + ".\n\nThank you for shopping with us!";
        System.out.println("📢 Notification: Order " + event.getOrderId() +
                " is now " + event.getStatus() +
                ". Email sent to " + event.getCustomerEmail());

        emailService.sendEmail(event.getCustomerEmail(), subject, body);
    }
}

