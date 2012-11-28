package controllers;

import play.*;
import play.mvc.*;

import java.util.*;

import models.*;

public class Application extends Controller {

    public static void index() {
        render();
    }

    public static void AddNote(String body)
    {
    	System.out.println(body);
    	Note note = new Note(body,"admin");
    	note.save();
    	render();
    }

}