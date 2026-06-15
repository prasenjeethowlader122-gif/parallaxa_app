package com.parallaxa.api.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {
        "/{path:^(?!api|uploads|.*\\.).*$}",
        "/{path1:^(?!api|uploads).*$}/{path2:[^\\.]*}",
        "/{path1:^(?!api|uploads).*$}/{path2:[^\\.]*}/{path3:[^\\.]*}"
    })
    public String redirect() {
        return "forward:/index.html";
    }
}
