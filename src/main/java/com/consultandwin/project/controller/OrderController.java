package com.consultandwin.project.controller;


import com.consultandwin.project.models.OrderEvent;
import com.consultandwin.project.models.OrderStatus;
import com.consultandwin.project.service.KafkaProducerService;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrderController {

    @Autowired
    private KafkaProducerService producerService;

    @PostMapping("/create")
    public ResponseEntity<String> createOrder(@RequestBody OrderEvent orderEvent) throws JsonProcessingException {
        orderEvent.setStatus(OrderStatus.CREATED);
        producerService.sendOrderEvent(orderEvent);
        return ResponseEntity.ok("Order Created and Event Published");
    }

    @PostMapping("/update-status")
    public ResponseEntity<String> updateStatus(@RequestBody OrderEvent orderEvent) throws JsonProcessingException {
        producerService.sendOrderEvent(orderEvent);
        return ResponseEntity.ok("Order status updated and Event Published");
    }
}

