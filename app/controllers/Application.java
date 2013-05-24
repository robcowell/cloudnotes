package controllers;

import play.*;
import play.modules.morphia.Model.MorphiaQuery;
import play.mvc.*;

import java.util.*;

import controllers.Secure.Security;

import models.*;

@With(Secure.class)
public class Application extends Controller {

    public static void index() {
    	List<Note> notes = Note.ds().find(Note.class,"Owner =",Security.connected()).asList();
    	System.out.println(notes.size() + " notes");
        render(notes);
    }

    public static void AddNote(String notebody)
    {
    	System.out.println(notebody);
    	
    	Note note = new Note(notebody,Security.connected());
    	note.save();
    	index();
    }
    
    public static void DeleteNote(String noteID)
    {
	Note note = Note.findById(noteID);
	note.delete();
	index();
    }

}